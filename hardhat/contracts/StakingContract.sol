// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract StakingContract is ERC20, AccessControl {
    using Strings for uint256;

    uint256 public constant totalTokenSupply = 1_022_000 * 10 ** 18;
    uint256 public constant daylyBatch = 2800 * 10 ** 18;
    uint256 public constant secondsInADay = 86400;
    uint256 public constant maxStakeAmount = 1000 * 10 ** 18;
    uint256 public numberOfStakers;
    uint256 public totalAmountStaked;
    uint256 public lastUpdate; // for the rewards

    struct Staker {
        uint256 amountStaked;
        uint256 lastStaked;
        uint256 rewards;
    }

    mapping(address => uint256) public nonStakerRewards; // this is to keep the rewards for 
														 // the users who are no longer stakers

    mapping(address => Staker) public stakers;
    address[] public stakerIndex;

    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant STAKER_ROLE = keccak256("STAKER_ROLE");
    bytes32 public constant CLAIMER_ROLE = keccak256("CLAIMER_ROLE");

    event Stake(address indexed user, uint256 amount);
    event Unstake(address indexed user, uint256 amount);
    event ClaimRewards(address indexed user, uint256 amount);

    constructor(string memory _name, string memory _symbol)
        ERC20(_name, _symbol) 
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DEFAULT_ADMIN_ROLE, address(this));
        _mint(address(this), totalTokenSupply);
        totalAmountStaked = 0;
    }

    modifier validBalance(uint256 minValue) {
        require(msg.value >= minValue, string(abi.encodePacked("Minimum value is ", formatEther(minValue), ".")));
        _;
    }

    modifier validValue(uint256 value, uint256 minValue)
    {
        require(value >= minValue, string(abi.encodePacked("Minimum value is ", formatEther(minValue), ".")));
        _;
    }

    modifier wait1Day() {
		require(
            (block.timestamp - stakers[msg.sender].lastStaked) >= secondsInADay,
            "You have to wait 1 day before you can take the action!"
        );
        _;
    }

    modifier validClaimer() {
		require(
            hasRole(CLAIMER_ROLE, msg.sender) ||
                hasRole(STAKER_ROLE, msg.sender),
            "Not eligible to claim rewards!"
        );
        _;
    }

    function formatEther(uint256 value) internal pure returns (string memory) {
        uint256 integerPart = value / 1 ether; 
        uint256 fractionalPart = (value % 1 ether) / 10 ** 14; 

        string memory integerPartStr = integerPart.toString();
        string memory fractionalPartStr = fractionalPart.toString();

        while (bytes(fractionalPartStr).length < 4) {
            fractionalPartStr = string(abi.encodePacked("0", fractionalPartStr));
        }

        return string(abi.encodePacked(integerPartStr, ".", fractionalPartStr));
    }

    function tokenURI() public pure returns (string memory) {
        return "http://localhost:3000/metadata.json";
    }


    // Calculates the reward for a user using the fromula:
    // (userAmount / totalAmountStaked) * daylyBatch * daysStaked
    function _calculateRewards(uint256 _amount) private view returns (uint256) {
        uint256 daysStaked = (block.timestamp - lastUpdate) / secondsInADay;
        if (totalAmountStaked == 0)
            return 0;
        return (_amount * daylyBatch * daysStaked) / totalAmountStaked;
    }

    // This function iterates through the mapping of users and updates their rewards
    // It does not use _calculateRewards for efficiency purposes
    // And it's meant to be called when the totalAmountStaked is changed
    function _updateRewards() private {
        for (uint i = 0; i < numberOfStakers; i++) {
			// if the user claimed rewards after the last update the number of days
			// is given by lastClaimedRewards
            stakers[stakerIndex[i]].rewards += _calculateRewards(stakers[stakerIndex[i]].amountStaked);
        }
        lastUpdate = block.timestamp;
    }

    // This function deletes a user from the mapping
    function _deleteUser(address _user) private {
        address userToBeDeleted;
        uint256 userIndex; // used to identify the user
        for (uint i = 0; i < numberOfStakers; i++)
            if (stakerIndex[i] == _user) {
                userToBeDeleted = stakerIndex[i];
                userIndex = i;
                break;
            }
		
        _revokeRole(STAKER_ROLE, userToBeDeleted); // revoke the staker role
        Staker storage user = stakers[userToBeDeleted];
        // if there are no rewards we don't need to give the user any special permission
		if (user.rewards > 0) {
            nonStakerRewards[userToBeDeleted] = user.rewards; // keep the rewards
            _grantRole(CLAIMER_ROLE, _user);
        }

		// if the user is not the last one in the mapping, swap with the last one
        if (userIndex != numberOfStakers - 1)
            user = stakers[stakerIndex[numberOfStakers - 1]];

		// delete the last user
        delete stakers[stakerIndex[numberOfStakers - 1]];
        numberOfStakers--;
        stakerIndex.pop();
    }


    function stake() external payable validBalance(0.01 ether) wait1Day {
        // Staker memory user = stakers[msg.sender];
        
        require(
            totalAmountStaked + msg.value <= maxStakeAmount,
            "The maximum staked amount has been exceeded!"
        );

        // if the user has the role it is already a stakeruser.
        if (!hasRole(STAKER_ROLE, msg.sender)) {
            _grantRole(STAKER_ROLE, msg.sender);
            numberOfStakers++;
            stakerIndex.push(msg.sender);
        }

        if ( // this condition is to avoid division by 0 for the first staker
            totalAmountStaked != 0
        ) {
            _updateRewards(); // the totalAmountStaked is going to change so we need to update
                            // the rewards before that
        }
        else {
            lastUpdate = block.timestamp;
        }

        stakers[msg.sender].amountStaked += msg.value;
        totalAmountStaked += msg.value;
        stakers[msg.sender].lastStaked = block.timestamp;
        emit Stake(msg.sender, msg.value);
    }

    function unstake(
        uint256 _amount
    ) external onlyRole(STAKER_ROLE) validValue(_amount, 0.01 ether) wait1Day {
        require(stakers[msg.sender].amountStaked >= _amount, "Insuficient balance!");

		// firstly update so the user won't loose the rewards
        _updateRewards();

        totalAmountStaked -= _amount;
        stakers[msg.sender].lastStaked = block.timestamp;
        stakers[msg.sender].amountStaked -= _amount;

		// if the user unstaked all tokens then we delete them from the mapping
        if (stakers[msg.sender].amountStaked == 0) {
            _deleteUser(msg.sender);
        }

        (bool sent, ) = msg.sender.call{value: _amount}("");

        require(sent, "Payment failed!");

        emit Unstake(msg.sender, _amount);
    }

    function claimRewards() external validClaimer {
        uint256 rewards; // for simplicity
        
		if (hasRole(CLAIMER_ROLE, msg.sender)) {
			// if they are a claimer then they have been deleted so 
			// their rewards are in nonStakerRewards mapping
            _revokeRole(CLAIMER_ROLE, msg.sender);
            rewards = nonStakerRewards[msg.sender];
            delete nonStakerRewards[msg.sender];
        } else {
            // Staker storage user = stakers[msg.sender];
            _updateRewards();
            rewards = stakers[msg.sender].rewards;
            stakers[msg.sender].rewards = 0;
			// this stops the user from abusing the claimRewards function if they are a staker
            require(rewards > 0, "No rewards to claim!");
        }

        require(balanceOf(address(this)) >= rewards, "Insufficient contract balance for rewards.");

        this.transfer(msg.sender, rewards);

        emit ClaimRewards(msg.sender, rewards);
    }

    function viewInfo() external view returns (uint256, uint256, uint256, uint256) {
        Staker memory user = stakers[msg.sender];
        uint256 rewards = 0;
        if (hasRole(CLAIMER_ROLE, msg.sender))
            rewards = nonStakerRewards[msg.sender];
        else
            rewards = user.rewards + _calculateRewards(user.amountStaked);
        
        return (
            user.amountStaked,
            rewards,
            user.lastStaked,
            totalAmountStaked
        );
    }

}
