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

    // IERC20 public stakingToken;
    uint256 public rewardRate; // Tokens rewarded per second
    uint256 public totalStaked;

    struct Staker {
        uint256 amountStaked;
        uint256 lastStaked;
        uint256 rewards;
        uint256 lastClaimedRewards;
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
    }

    modifier validBalance(uint256 minValue) {
        require(msg.value >= minValue, string(abi.encodePacked("Minimum value is ", minValue.toString(), ".")));
        _;
    }

    modifier validValue(uint256 value, uint256 minValue)
    {
        require(value >= minValue, string(abi.encodePacked("Minimum value is ", minValue.toString(), ".")));
        _;
    }

    modifier wait1Day() {
        Staker memory user = stakers[msg.sender];
		require(
            (block.timestamp - user.lastStaked) >= secondsInADay,
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

    // Calculates the reward for a user using the fromula:
    // (userAmount / totalAmountStaked) * daylyBatch * daysStaked
    function _calculateRewards(address _user) private view returns (uint256) {
        uint256 reward;
        uint256 daysStaked = (block.timestamp - lastUpdate) / secondsInADay;
        reward =
            (stakers[_user].amountStaked * daylyBatch * daysStaked) /
            totalAmountStaked;
        return reward;
    }

    // This function iterates through the mapping of users and updates their rewards
    // It does not use _calculateRewards for efficiency purposes
    // And it's meant to be called when the totalAmountStaked is changed
    function _updateRewards() private {
        uint256 daysStaked = (block.timestamp - lastUpdate) / secondsInADay;

        for (uint i = 0; i < numberOfStakers; i++) {
			// if the user claimed rewards after the last update the number of days
			// is given by lastClaimedRewards
            if (stakers[stakerIndex[i]].lastClaimedRewards > lastUpdate) {
                daysStaked =
                    (block.timestamp -
                        stakers[stakerIndex[i]].lastClaimedRewards) /
                    secondsInADay;
            }
            stakers[stakerIndex[i]].rewards +=
                (stakers[stakerIndex[i]].amountStaked *
                    daylyBatch *
                    daysStaked) /
                totalAmountStaked;
        }
    }

    // This function deletes a user from the mapping
    function _deleteUser(address _user) private {
        uint256 userToBeDeleted = 0; // used to identify the user
        for (uint i = 0; i < numberOfStakers; i++)
            if (stakerIndex[i] == _user) {
                userToBeDeleted = i;
                break;
            }
		
        this.revokeRole(STAKER_ROLE, stakerIndex[userToBeDeleted]); // revoke the staker role
        uint256 rewards = stakers[stakerIndex[userToBeDeleted]].rewards;
        // if there are no rewards we don't need to give the user any special permission
		if (rewards > 0) {
            nonStakerRewards[stakerIndex[userToBeDeleted]] = rewards; // keep the rewards
            this.grantRole(CLAIMER_ROLE, _user);
        }
		// if the user is not the last one in the mapping, swap with the last one
        if (userToBeDeleted != numberOfStakers - 1)
            stakers[stakerIndex[userToBeDeleted]] = stakers[stakerIndex[numberOfStakers - 1]
            ];
		// delete the last user
        delete stakers[stakerIndex[numberOfStakers - 1]];
        numberOfStakers--;
    }


    function stake() external payable validBalance(0.01 ether) wait1Day {
        // require(msg.value > 0, "The value must be a positive number!");
        Staker memory user = stakers[msg.sender];
        
		// require(
        //     (block.timestamp - user.lastStaked) >= secondsInADay,
        //     "You have to wait 1 day before you can stake!"
        // );

        require(
            totalAmountStaked + msg.value <= maxStakeAmount,
            "The maximum staked amount has been exceeded!"
        );

        // if the user has the role it is already a staker
        if (!hasRole(STAKER_ROLE, msg.sender)) {
            this.grantRole(STAKER_ROLE, msg.sender);
            numberOfStakers++;
            stakerIndex.push(msg.sender);
        }
        user.amountStaked += msg.value;

        if ( // this condition is to avoid division by 0 for the first staker
            block.timestamp - lastUpdate >= secondsInADay &&
            totalAmountStaked != 0
        ) {
            _updateRewards(); // the totalAmountStaked is going to change so we need to update
                            // the rewards before that
        }

        totalAmountStaked += msg.value;
        user.lastStaked = block.timestamp;
        user.lastClaimedRewards = block.timestamp;
        lastUpdate = block.timestamp;
        stakers[msg.sender] = user;
        emit Stake(msg.sender, msg.value);
    }

    function unstake(
        uint256 _amount
    ) external onlyRole(STAKER_ROLE) validValue(_amount, 0.01 ether) wait1Day {
        Staker memory user = stakers[msg.sender];
        require(user.amountStaked >= _amount, "Insuficient balance!");
        // require(_amount > 0, "Nothing to unstake!");
        // require(
        //     (block.timestamp - user.lastStaked) > secondsInADay,
        //     "You have to wait 1 day before you can unstake!"
        // );

		// need to firstly update so the user won't loose the rewards
        if (block.timestamp - lastUpdate >= secondsInADay) _updateRewards();

        totalAmountStaked -= _amount;
        user.lastStaked = block.timestamp;
        user.amountStaked -= _amount;
		// if the user unstaked all tokens then we delete them from the mapping
        if (user.amountStaked == 0) {
            _deleteUser(msg.sender);
        } else {
            stakers[msg.sender] = user;
        }
        (bool sent, ) = msg.sender.call{value: _amount}("");

        require(sent, "Payment failed!");

        emit Unstake(msg.sender, _amount);
    }

    function claimRewards() external validClaimer {
        // the user has to be a staker or a claimer in order to claim rewards
		// require(
        //     hasRole(CLAIMER_ROLE, msg.sender) ||
        //         hasRole(STAKER_ROLE, msg.sender),
        //     "Not eligible to claim rewards!"
        // );

        uint256 rewards; // for simplicity
        
		if (hasRole(CLAIMER_ROLE, msg.sender)) {
			// if they are a claimer then they have been deleted so 
			// their rewards are in nonStakerRewards mapping
            this.revokeRole(CLAIMER_ROLE, msg.sender);
            rewards = nonStakerRewards[msg.sender];
            delete nonStakerRewards[msg.sender];
        } else {
			// the number of days staked differs if the user had claimed rewards before an update
            if (stakers[msg.sender].lastClaimedRewards > lastUpdate) {
                uint256 daysStaked = (block.timestamp -
                    stakers[msg.sender].lastClaimedRewards) / secondsInADay;
                rewards =
                    (stakers[msg.sender].amountStaked *
                        daylyBatch *
                        daysStaked) /
                    totalAmountStaked;
            } else {
                rewards =
                    stakers[msg.sender].rewards +
                    _calculateRewards(msg.sender);
            }
            stakers[msg.sender].rewards = 0;
			// this stops the user from abusing the claimRewards function if they are a staker
            require(rewards > 0, "No rewards to claim!");
        }

        stakers[msg.sender].lastClaimedRewards = block.timestamp;

        this.transfer(msg.sender, rewards);

        emit ClaimRewards(msg.sender, rewards);
    }

	// just a function for users to see their rewards
    function viewRewards() external view validClaimer returns (uint256) { 
        // require(
        //     hasRole(CLAIMER_ROLE, msg.sender) ||
        //         hasRole(STAKER_ROLE, msg.sender),
        //     "Not eligible to view rewards!"
        // );
        return (stakers[msg.sender].rewards + _calculateRewards(msg.sender));
    }
}
