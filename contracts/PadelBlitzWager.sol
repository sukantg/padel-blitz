// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title PadelBlitzWager
/// @notice On-chain peer-to-peer wagering for padel matches plus on-chain NFT card storage.
/// @dev Deploy to Monad Testnet (chainId 10143). Deployer becomes admin.
contract PadelBlitzWager {
    enum State {
        Open,
        Active,
        Settled,
        Cancelled
    }

    struct Match {
        address player1;
        address player2;
        uint256 wagerAmount;
        uint8 state; // 0=Open, 1=Active, 2=Settled, 3=Cancelled
        address winner;
        string description;
        uint256 createdAt;
    }

    address public admin;
    uint256 public matchCount;
    uint256 public constant FEE_BPS = 100; // 1%

    mapping(uint256 => Match) public matches;
    mapping(address => string) public nftOf;

    event MatchCreated(
        uint256 indexed matchId,
        address indexed player1,
        uint256 wagerAmount,
        string description
    );
    event MatchJoined(uint256 indexed matchId, address indexed player2);
    event MatchSettled(
        uint256 indexed matchId,
        address indexed winner,
        uint256 payout
    );
    event MatchCancelled(uint256 indexed matchId);
    event NFTStored(address indexed player, string tokenURI);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function createMatch(string calldata description)
        external
        payable
        returns (uint256)
    {
        require(msg.value > 0, "Wager must be > 0");
        uint256 matchId = matchCount++;
        matches[matchId] = Match({
            player1: msg.sender,
            player2: address(0),
            wagerAmount: msg.value,
            state: uint8(State.Open),
            winner: address(0),
            description: description,
            createdAt: block.timestamp
        });
        emit MatchCreated(matchId, msg.sender, msg.value, description);
        return matchId;
    }

    function joinMatch(uint256 matchId) external payable {
        Match storage m = matches[matchId];
        require(m.state == uint8(State.Open), "Not open");
        require(m.player1 != msg.sender, "Cannot join own match");
        require(msg.value == m.wagerAmount, "Must match wager exactly");
        m.player2 = msg.sender;
        m.state = uint8(State.Active);
        emit MatchJoined(matchId, msg.sender);
    }

    function declareWinner(uint256 matchId, address winner) external onlyAdmin {
        Match storage m = matches[matchId];
        require(m.state == uint8(State.Active), "Not active");
        require(winner == m.player1 || winner == m.player2, "Invalid winner");

        uint256 pot = m.wagerAmount * 2;
        uint256 fee = (pot * FEE_BPS) / 10000;
        uint256 payout = pot - fee;

        m.state = uint8(State.Settled);
        m.winner = winner;

        (bool feeSent, ) = payable(admin).call{value: fee}("");
        require(feeSent, "Fee transfer failed");
        (bool paid, ) = payable(winner).call{value: payout}("");
        require(paid, "Payout failed");

        emit MatchSettled(matchId, winner, payout);
    }

    function cancelMatch(uint256 matchId) external {
        Match storage m = matches[matchId];
        require(m.state == uint8(State.Open), "Only open matches");
        require(
            msg.sender == m.player1 || msg.sender == admin,
            "Not authorized"
        );
        m.state = uint8(State.Cancelled);
        uint256 refund = m.wagerAmount;
        (bool sent, ) = payable(m.player1).call{value: refund}("");
        require(sent, "Refund failed");
        emit MatchCancelled(matchId);
    }

    function getMatch(uint256 matchId) external view returns (Match memory) {
        return matches[matchId];
    }

    function storeNFT(string calldata tokenURI) external {
        nftOf[msg.sender] = tokenURI;
        emit NFTStored(msg.sender, tokenURI);
    }

    function getNFT(address player) external view returns (string memory) {
        return nftOf[player];
    }
}
