// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract TerraChainSimple is ERC721, AccessControl {
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    uint256 public nextLandId = 1;

    constructor() ERC721("TerraChain Land", "TCLAND") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VALIDATOR_ROLE, msg.sender);
    }

    enum RiskLevel {
        Low,
        Medium,
        High
    }

    enum TransferStatus {
        None,
        Pending,
        Approved,
        Frozen
    }

    struct Land {
        uint256 landId;
        string metadataURI;
        uint256 price;
        uint256 lastTransferTime;
        bool exists;
    }

    struct TransferRequest {
        address from;
        address to;
        uint256 landId;
        uint256 riskScore;
        RiskLevel riskLevel;
        TransferStatus status;
    }

    mapping(uint256 => Land) public lands;
    mapping(uint256 => TransferRequest) public transferRequests;

    event LandRegistered(
        uint256 indexed landId,
        address indexed owner,
        string metadataURI,
        uint256 price
    );

    event TransferRequested(
        uint256 indexed landId,
        address indexed from,
        address indexed to
    );

    event RiskValidated(
        uint256 indexed landId,
        uint256 riskScore,
        RiskLevel riskLevel,
        TransferStatus status
    );

    event TransferApproved(
        uint256 indexed landId,
        address indexed approver
    );

    event TransferExecuted(
        uint256 indexed landId,
        address indexed oldOwner,
        address indexed newOwner
    );

    event TransferFrozen(uint256 indexed landId);

    modifier onlyLandOwner(uint256 _landId) {
        require(lands[_landId].exists, "Land not found");
        require(ownerOf(_landId) == msg.sender, "Not land owner");
        _;
    }

    function registerLand(
        address _owner,
        string memory _metadataURI,
        uint256 _price
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_owner != address(0), "Invalid owner");

        uint256 landId = nextLandId;
        nextLandId++;

        _safeMint(_owner, landId);

        lands[landId] = Land({
            landId: landId,
            metadataURI: _metadataURI,
            price: _price,
            lastTransferTime: block.timestamp,
            exists: true
        });

        emit LandRegistered(landId, _owner, _metadataURI, _price);
    }

    function requestTransfer(
        uint256 _landId,
        address _to
    ) public onlyLandOwner(_landId) {
        require(_to != address(0), "Invalid recipient");
        require(_to != msg.sender, "Cannot transfer to self");
        require(
            transferRequests[_landId].status != TransferStatus.Pending &&
                transferRequests[_landId].status != TransferStatus.Approved,
            "Transfer already active"
        );

        transferRequests[_landId] = TransferRequest({
            from: msg.sender,
            to: _to,
            landId: _landId,
            riskScore: 0,
            riskLevel: RiskLevel.Low,
            status: TransferStatus.Pending
        });

        emit TransferRequested(_landId, msg.sender, _to);
    }

    function validateRisk(
        uint256 _landId,
        uint256 _riskScore
    ) public onlyRole(VALIDATOR_ROLE) {
        require(lands[_landId].exists, "Land not found");
        require(
            transferRequests[_landId].status == TransferStatus.Pending,
            "No pending transfer"
        );
        require(_riskScore <= 100, "Risk score must be 0-100");

        RiskLevel level;
        TransferStatus status;

        if (_riskScore <= 30) {
            level = RiskLevel.Low;
            status = TransferStatus.Approved;
        } else if (_riskScore <= 70) {
            level = RiskLevel.Medium;
            status = TransferStatus.Pending;
        } else {
            level = RiskLevel.High;
            status = TransferStatus.Frozen;
        }

        transferRequests[_landId].riskScore = _riskScore;
        transferRequests[_landId].riskLevel = level;
        transferRequests[_landId].status = status;

        emit RiskValidated(_landId, _riskScore, level, status);
    }

    function approvePendingTransfer(uint256 _landId) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(lands[_landId].exists, "Land not found");
        require(
            transferRequests[_landId].status == TransferStatus.Pending,
            "Transfer not pending"
        );

        transferRequests[_landId].status = TransferStatus.Approved;
        emit TransferApproved(_landId, msg.sender);
    }

    function executeApprovedTransfer(uint256 _landId) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(lands[_landId].exists, "Land not found");
        require(
            transferRequests[_landId].status == TransferStatus.Approved,
            "Transfer not approved"
        );

        address oldOwner = ownerOf(_landId);
        address newOwner = transferRequests[_landId].to;

        _transfer(oldOwner, newOwner, _landId);
        lands[_landId].lastTransferTime = block.timestamp;
        emit TransferExecuted(_landId, oldOwner, newOwner);

        delete transferRequests[_landId];
    }

    function freezeTransfer(uint256 _landId) public onlyRole(VALIDATOR_ROLE) {
        require(lands[_landId].exists, "Land not found");
        require(
            transferRequests[_landId].status == TransferStatus.Pending ||
            transferRequests[_landId].status == TransferStatus.Frozen,
            "Transfer not valid"
        );

        transferRequests[_landId].status = TransferStatus.Frozen;

        emit TransferFrozen(_landId);
    }

    function getLand(
        uint256 _landId
    )
        public
        view
        returns (
            uint256 landId,
            address owner,
            string memory metadataURI,
            uint256 price,
            uint256 lastTransferTime,
            bool exists
        )
    {
        Land memory l = lands[_landId];
        return (
            l.landId,
            l.exists ? ownerOf(_landId) : address(0),
            l.metadataURI,
            l.price,
            l.lastTransferTime,
            l.exists
        );
    }

    function getTransferRequest(
        uint256 _landId
    )
        public
        view
        returns (
            address from,
            address to,
            uint256 landId,
            uint256 riskScore,
            RiskLevel riskLevel,
            TransferStatus status
        )
    {
        TransferRequest memory t = transferRequests[_landId];
        return (
            t.from,
            t.to,
            t.landId,
            t.riskScore,
            t.riskLevel,
            t.status
        );
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
