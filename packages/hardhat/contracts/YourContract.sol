//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
import "hardhat/console.sol";

// Use openzeppelin to inherit battle-tested implementations (ERC20, ERC721, etc)
// import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * A smart contract that allows changing a state variable of the contract and tracking the changes
 * It also allows the owner to withdraw the Ether in the contract
 * @author BuidlGuidl
 */
contract YourContract {
    // Gas Information Structure
    struct GasInfo {
        uint256 gasUsed;
        uint256 gasPrice;
        uint256 gasCost;
        uint256 timestamp;
        address txOrigin;
        string functionName;
    }

    // State Variables
    address public immutable owner;
    string public greeting = "Building Unstoppable Apps!!!";
    bool public premium = false;
    uint256 public totalCounter = 0;
    mapping(address => uint) public userGreetingCounter;
    
    // Gas tracking variables
    mapping(address => GasInfo[]) public userGasHistory;
    GasInfo[] public globalGasHistory;
    uint256 public totalGasRecords = 0;

    // Events: a way to emit log statements from smart contract that can be listened to by external parties
    event GreetingChange(address indexed greetingSetter, string newGreeting, bool premium, uint256 value);
    event GasUsageRecorded(
        address indexed user,
        uint256 gasUsed,
        uint256 gasPrice,
        uint256 gasCost,
        string functionName
    );

    // Constructor: Called once on contract deployment
    // Check packages/hardhat/deploy/00_deploy_your_contract.ts
    constructor(address _owner) {
        owner = _owner;
    }

    // Modifier: used to define a set of rules that must be met before or after a function is executed
    // Check the withdraw() function
    modifier isOwner() {
        // msg.sender: predefined variable that represents address of the account that called the current function
        require(msg.sender == owner, "Not the Owner");
        _;
    }

    /**
     * Internal function to record gas usage information
     * @param _functionName - name of the function being executed
     * @param _startGas - gas amount at function start
     */
    function _recordGasUsage(string memory _functionName, uint256 _startGas) internal {
        uint256 gasUsed = _startGas - gasleft();
        uint256 gasPrice = tx.gasprice;
        uint256 gasCost = gasUsed * gasPrice;
        
        GasInfo memory gasInfo = GasInfo({
            gasUsed: gasUsed,
            gasPrice: gasPrice,
            gasCost: gasCost,
            timestamp: block.timestamp,
            txOrigin: tx.origin,
            functionName: _functionName
        });
        
        userGasHistory[msg.sender].push(gasInfo);
        globalGasHistory.push(gasInfo);
        totalGasRecords += 1;
        
        emit GasUsageRecorded(msg.sender, gasUsed, gasPrice, gasCost, _functionName);
    }

    /**
     * Function that allows anyone to change the state variable "greeting" of the contract and increase the counters
     *
     * @param _newGreeting (string memory) - new greeting to save on the contract
     */
    function setGreeting(string memory _newGreeting) public payable {
        uint256 startGas = gasleft();
        
        // Print data to the hardhat chain console. Remove when deploying to a live network.
        console.log("Setting new greeting '%s' from %s", _newGreeting, msg.sender);

        // Change state variables
        greeting = _newGreeting;
        totalCounter += 1;
        userGreetingCounter[msg.sender] += 1;

        // msg.value: built-in global variable that represents the amount of ether sent with the transaction
        if (msg.value > 0) {
            premium = true;
        } else {
            premium = false;
        }

        // Record gas usage
        _recordGasUsage("setGreeting", startGas);

        // emit: keyword used to trigger an event
        emit GreetingChange(msg.sender, _newGreeting, msg.value > 0, msg.value);
    }

    /**
     * Get current transaction gas information
     * @return gasPrice - current gas price in wei
     * @return gasLimit - current block gas limit
     * @return gasUsed - gas used in current block
     */
    function getCurrentGasInfo() public view returns (uint256 gasPrice, uint256 gasLimit, uint256 gasUsed) {
        return (tx.gasprice, block.gaslimit, block.gaslimit - gasleft());
    }

    /**
     * Get gas usage history for a specific user
     * @param _user - address of the user
     * @return gasHistory - array of gas usage records
     */
    function getUserGasHistory(address _user) public view returns (GasInfo[] memory) {
        return userGasHistory[_user];
    }

    /**
     * Get recent global gas usage history
     * @param _count - number of recent records to retrieve
     * @return gasHistory - array of recent gas usage records
     */
    function getRecentGasHistory(uint256 _count) public view returns (GasInfo[] memory) {
        require(_count > 0, "Count must be greater than 0");
        
        uint256 length = globalGasHistory.length;
        if (_count > length) {
            _count = length;
        }
        
        GasInfo[] memory recentHistory = new GasInfo[](_count);
        
        for (uint256 i = 0; i < _count; i++) {
            recentHistory[i] = globalGasHistory[length - _count + i];
        }
        
        return recentHistory;
    }

    /**
     * Get gas statistics for the contract
     * @return totalRecords - total number of gas records
     * @return averageGasUsed - average gas used across all transactions
     * @return averageGasPrice - average gas price across all transactions
     */
    function getGasStatistics() public view returns (
        uint256 totalRecords,
        uint256 averageGasUsed,
        uint256 averageGasPrice
    ) {
        uint256 length = globalGasHistory.length;
        if (length == 0) {
            return (0, 0, 0);
        }
        
        uint256 totalGasUsed = 0;
        uint256 totalGasPrice = 0;
        
        for (uint256 i = 0; i < length; i++) {
            totalGasUsed += globalGasHistory[i].gasUsed;
            totalGasPrice += globalGasHistory[i].gasPrice;
        }
        
        return (
            length,
            totalGasUsed / length,
            totalGasPrice / length
        );
    }

    /**
     * Estimate gas cost for setting greeting
     * @param _newGreeting - the greeting to estimate gas for
     * @return estimatedGas - estimated gas units needed
     * @return estimatedCost - estimated cost in wei at current gas price
     */
    function estimateSetGreetingGas(string memory _newGreeting) public view returns (uint256 estimatedGas, uint256 estimatedCost) {
        // Base gas estimation (this is an approximation)
        uint256 baseGas = 21000; // Base transaction gas
        uint256 stringGas = bytes(_newGreeting).length * 68; // Approximate gas for string storage
        uint256 storageGas = 5000; // Approximate gas for state changes
        
        estimatedGas = baseGas + stringGas + storageGas;
        estimatedCost = estimatedGas * tx.gasprice;
        
        return (estimatedGas, estimatedCost);
    }

    /**
     * Function that allows the owner to withdraw all the Ether in the contract
     * The function can only be called by the owner of the contract as defined by the isOwner modifier
     */
    function withdraw() public isOwner {
        uint256 startGas = gasleft();
        
        (bool success, ) = owner.call{ value: address(this).balance }("");
        require(success, "Failed to send Ether");
        
        _recordGasUsage("withdraw", startGas);
    }

    /**
     * Function that allows the contract to receive ETH
     */
    receive() external payable {}
}
