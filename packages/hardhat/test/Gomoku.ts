import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Gomoku", function () {
  let gomoku: any;
  let player1: HardhatEthersSigner;
  let player2: HardhatEthersSigner;
  let player3: HardhatEthersSigner;

  beforeEach(async function () {
    [, player1, player2, player3] = await ethers.getSigners();

    const GomokuFactory = await ethers.getContractFactory("Gomoku");
    gomoku = await GomokuFactory.deploy();
    await gomoku.waitForDeployment();
  });

  describe("Game Creation", function () {
    it("Should create a new game", async function () {
      const tx = await gomoku.connect(player1).createGame();
      await expect(tx).to.emit(gomoku, "GameCreated").withArgs(1, player1.address);

      const game = await gomoku.getGame(1);
      expect(game.gameId).to.equal(1);
      expect(game.player1).to.equal(player1.address);
      expect(game.player2).to.equal(ethers.ZeroAddress);
      expect(game.status).to.equal(0); // Waiting
    });

    it("Should add game to waiting list", async function () {
      await gomoku.connect(player1).createGame();
      const waitingGames = await gomoku.getWaitingGames();
      expect(waitingGames).to.include(1n);
    });

    it("Should track player games", async function () {
      await gomoku.connect(player1).createGame();
      const playerGames = await gomoku.getPlayerGames(player1.address);
      expect(playerGames).to.include(1n);
    });
  });

  describe("Game Joining", function () {
    beforeEach(async function () {
      await gomoku.connect(player1).createGame();
    });

    it("Should allow another player to join", async function () {
      const tx = await gomoku.connect(player2).joinGame(1);
      await expect(tx).to.emit(gomoku, "GameJoined").withArgs(1, player1.address, player2.address);

      const game = await gomoku.getGame(1);
      expect(game.player2).to.equal(player2.address);
      expect(game.status).to.equal(1); // Playing
    });

    it("Should remove game from waiting list after joining", async function () {
      await gomoku.connect(player2).joinGame(1);
      const waitingGames = await gomoku.getWaitingGames();
      expect(waitingGames).to.not.include(1n);
    });

    it("Should not allow creator to join their own game", async function () {
      await expect(gomoku.connect(player1).joinGame(1)).to.be.revertedWith("Cannot join your own game");
    });

    it("Should not allow joining a full game", async function () {
      await gomoku.connect(player2).joinGame(1);
      await expect(gomoku.connect(player3).joinGame(1)).to.be.revertedWith("Game is already full");
    });

    it("Should not allow joining non-existent game", async function () {
      await expect(gomoku.connect(player2).joinGame(999)).to.be.revertedWith("Game does not exist");
    });
  });

  describe("Game Cancellation", function () {
    beforeEach(async function () {
      await gomoku.connect(player1).createGame();
    });

    it("Should allow creator to cancel waiting game", async function () {
      const tx = await gomoku.connect(player1).cancelGame(1);
      await expect(tx).to.emit(gomoku, "GameCancelled").withArgs(1);

      const game = await gomoku.getGame(1);
      expect(game.status).to.equal(3); // Cancelled
    });

    it("Should not allow non-creator to cancel game", async function () {
      await expect(gomoku.connect(player2).cancelGame(1)).to.be.revertedWith("Only creator can cancel");
    });

    it("Should not allow cancelling playing game", async function () {
      await gomoku.connect(player2).joinGame(1);
      await expect(gomoku.connect(player1).cancelGame(1)).to.be.revertedWith("Can only cancel waiting games");
    });
  });

  describe("Game Playing", function () {
    beforeEach(async function () {
      await gomoku.connect(player1).createGame();
      await gomoku.connect(player2).joinGame(1);
    });

    it("Should allow current player to make a move", async function () {
      const tx = await gomoku.connect(player1).makeMove(1, 7, 7);
      await expect(tx).to.emit(gomoku, "MoveMade").withArgs(1, player1.address, 7, 7, 1); // Black piece

      const board = await gomoku.getBoard(1);
      expect(board[7][7]).to.equal(1); // Black
    });

    it("Should switch turns after a move", async function () {
      await gomoku.connect(player1).makeMove(1, 7, 7);

      const game = await gomoku.getGame(1);
      expect(game.currentPlayer).to.equal(player2.address);
    });

    it("Should not allow non-current player to move", async function () {
      await expect(gomoku.connect(player2).makeMove(1, 7, 7)).to.be.revertedWith("Not your turn");
    });

    it("Should not allow move on occupied position", async function () {
      await gomoku.connect(player1).makeMove(1, 7, 7);
      await expect(gomoku.connect(player2).makeMove(1, 7, 7)).to.be.revertedWith("Position already occupied");
    });

    it("Should not allow move outside board", async function () {
      await expect(gomoku.connect(player1).makeMove(1, 15, 15)).to.be.revertedWith("Invalid coordinates");
    });

    it("Should record game moves", async function () {
      await gomoku.connect(player1).makeMove(1, 7, 7);
      await gomoku.connect(player2).makeMove(1, 8, 8);

      const moves = await gomoku.getGameMoves(1);
      expect(moves.length).to.equal(2);
      expect(moves[0].x).to.equal(7);
      expect(moves[0].y).to.equal(7);
      expect(moves[0].player).to.equal(player1.address);
      expect(moves[1].x).to.equal(8);
      expect(moves[1].y).to.equal(8);
      expect(moves[1].player).to.equal(player2.address);
    });
  });

  describe("Win Detection", function () {
    beforeEach(async function () {
      await gomoku.connect(player1).createGame();
      await gomoku.connect(player2).joinGame(1);
    });

    it("Should detect horizontal win", async function () {
      // Player1 (Black) wins horizontally
      await gomoku.connect(player1).makeMove(1, 7, 7);
      await gomoku.connect(player2).makeMove(1, 8, 8);
      await gomoku.connect(player1).makeMove(1, 7, 8);
      await gomoku.connect(player2).makeMove(1, 9, 9);
      await gomoku.connect(player1).makeMove(1, 7, 9);
      await gomoku.connect(player2).makeMove(1, 10, 10);
      await gomoku.connect(player1).makeMove(1, 7, 10);
      await gomoku.connect(player2).makeMove(1, 11, 11);

      const tx = await gomoku.connect(player1).makeMove(1, 7, 11);
      await expect(tx).to.emit(gomoku, "GameFinished").withArgs(1, player1.address, false);

      const game = await gomoku.getGame(1);
      expect(game.status).to.equal(2); // Finished
      expect(game.winner).to.equal(player1.address);
    });

    it("Should detect vertical win", async function () {
      // Player1 (Black) wins vertically
      await gomoku.connect(player1).makeMove(1, 7, 7);
      await gomoku.connect(player2).makeMove(1, 8, 8);
      await gomoku.connect(player1).makeMove(1, 8, 7);
      await gomoku.connect(player2).makeMove(1, 9, 9);
      await gomoku.connect(player1).makeMove(1, 9, 7);
      await gomoku.connect(player2).makeMove(1, 10, 10);
      await gomoku.connect(player1).makeMove(1, 10, 7);
      await gomoku.connect(player2).makeMove(1, 11, 11);

      const tx = await gomoku.connect(player1).makeMove(1, 11, 7);
      await expect(tx).to.emit(gomoku, "GameFinished").withArgs(1, player1.address, false);
    });

    it("Should detect diagonal win", async function () {
      // Player1 (Black) wins diagonally
      await gomoku.connect(player1).makeMove(1, 7, 7);
      await gomoku.connect(player2).makeMove(1, 7, 8);
      await gomoku.connect(player1).makeMove(1, 8, 8);
      await gomoku.connect(player2).makeMove(1, 7, 9);
      await gomoku.connect(player1).makeMove(1, 9, 9);
      await gomoku.connect(player2).makeMove(1, 7, 10);
      await gomoku.connect(player1).makeMove(1, 10, 10);
      await gomoku.connect(player2).makeMove(1, 7, 11);

      const tx = await gomoku.connect(player1).makeMove(1, 11, 11);
      await expect(tx).to.emit(gomoku, "GameFinished").withArgs(1, player1.address, false);
    });

    it("Should update player statistics on win", async function () {
      // Simple horizontal win for player1
      for (let i = 0; i < 5; i++) {
        await gomoku.connect(player1).makeMove(1, 7, 7 + i);
        if (i < 4) {
          await gomoku.connect(player2).makeMove(1, 8, 8 + i);
        }
      }

      const [player1Wins, player1Losses] = await gomoku.getPlayerStats(player1.address);
      const [player2Wins, player2Losses] = await gomoku.getPlayerStats(player2.address);

      expect(player1Wins).to.equal(1);
      expect(player1Losses).to.equal(0);
      expect(player2Wins).to.equal(0);
      expect(player2Losses).to.equal(1);
    });
  });

  describe("Game State Queries", function () {
    beforeEach(async function () {
      await gomoku.connect(player1).createGame();
      await gomoku.connect(player2).joinGame(1);
      await gomoku.connect(player1).makeMove(1, 7, 7);
    });

    it("Should return correct game state", async function () {
      const game = await gomoku.getGame(1);
      expect(game.gameId).to.equal(1);
      expect(game.player1).to.equal(player1.address);
      expect(game.player2).to.equal(player2.address);
      expect(game.currentPlayer).to.equal(player2.address);
      expect(game.status).to.equal(1); // Playing
    });

    it("Should return correct board state", async function () {
      const board = await gomoku.getBoard(1);
      expect(board[7][7]).to.equal(1); // Black piece
      expect(board[0][0]).to.equal(0); // Empty
    });

    it("Should return player games list", async function () {
      await gomoku.connect(player1).createGame(); // Game 2

      const player1Games = await gomoku.getPlayerGames(player1.address);
      expect(player1Games.length).to.equal(2);
      expect(player1Games).to.include(1n);
      expect(player1Games).to.include(2n);
    });

    it("Should return waiting games list", async function () {
      await gomoku.connect(player3).createGame(); // Game 2

      const waitingGames = await gomoku.getWaitingGames();
      expect(waitingGames).to.include(2n);
      expect(waitingGames).to.not.include(1n); // Game 1 is playing
    });
  });

  describe("Practice Mode", function () {
    it("Should create a practice game", async function () {
      const tx = await gomoku.connect(player1).createPracticeGame();
      await expect(tx).to.emit(gomoku, "GameCreated").withArgs(1, player1.address);
      await expect(tx).to.emit(gomoku, "GameJoined").withArgs(1, player1.address, player1.address);

      const game = await gomoku.getGame(1);
      expect(game.gameId).to.equal(1);
      expect(game.player1).to.equal(player1.address);
      expect(game.player2).to.equal(player1.address); // Same address for both sides
      expect(game.status).to.equal(1); // Playing
      expect(game.isPracticeMode).to.equal(true);
    });

    it("Should not add practice game to waiting list", async function () {
      await gomoku.connect(player1).createPracticeGame();
      const waitingGames = await gomoku.getWaitingGames();
      expect(waitingGames).to.not.include(1n);
    });

    it("Should allow single player to control both sides", async function () {
      await gomoku.connect(player1).createPracticeGame();

      // Player1 can make first move (black)
      await gomoku.connect(player1).makeMove(1, 7, 7);

      let board = await gomoku.getBoard(1);
      expect(board[7][7]).to.equal(1); // Black piece

      // Same player can make second move (white)
      await gomoku.connect(player1).makeMove(1, 8, 8);

      board = await gomoku.getBoard(1);
      expect(board[8][8]).to.equal(2); // White piece

      const game = await gomoku.getGame(1);
      expect(game.moveCount).to.equal(2);
    });

    it("Should alternate piece colors in practice mode", async function () {
      await gomoku.connect(player1).createPracticeGame();

      // First move should be black
      await gomoku.connect(player1).makeMove(1, 0, 0);
      let board = await gomoku.getBoard(1);
      expect(board[0][0]).to.equal(1); // Black

      // Second move should be white
      await gomoku.connect(player1).makeMove(1, 0, 1);
      board = await gomoku.getBoard(1);
      expect(board[0][1]).to.equal(2); // White

      // Third move should be black again
      await gomoku.connect(player1).makeMove(1, 0, 2);
      board = await gomoku.getBoard(1);
      expect(board[0][2]).to.equal(1); // Black
    });

    it("Should not update player stats in practice mode", async function () {
      await gomoku.connect(player1).createPracticeGame();

      // Create a winning scenario for black
      for (let i = 0; i < 5; i++) {
        await gomoku.connect(player1).makeMove(1, 7, 7 + i); // Black moves
        if (i < 4) {
          await gomoku.connect(player1).makeMove(1, 8, 8 + i); // White moves
        }
      }

      const [wins, losses] = await gomoku.getPlayerStats(player1.address);
      expect(wins).to.equal(0); // Should not increment in practice mode
      expect(losses).to.equal(0);
    });

    it("Should not allow other players to move in practice game", async function () {
      await gomoku.connect(player1).createPracticeGame();

      await expect(gomoku.connect(player2).makeMove(1, 7, 7)).to.be.revertedWith("Only practice game creator can move");
    });

    it("Should detect win in practice mode", async function () {
      await gomoku.connect(player1).createPracticeGame();

      // Create winning scenario
      await gomoku.connect(player1).makeMove(1, 7, 7); // Black
      await gomoku.connect(player1).makeMove(1, 8, 8); // White
      await gomoku.connect(player1).makeMove(1, 7, 8); // Black
      await gomoku.connect(player1).makeMove(1, 9, 9); // White
      await gomoku.connect(player1).makeMove(1, 7, 9); // Black
      await gomoku.connect(player1).makeMove(1, 10, 10); // White
      await gomoku.connect(player1).makeMove(1, 7, 10); // Black
      await gomoku.connect(player1).makeMove(1, 11, 11); // White

      const tx = await gomoku.connect(player1).makeMove(1, 7, 11); // Black wins
      await expect(tx).to.emit(gomoku, "GameFinished").withArgs(1, player1.address, false);

      const game = await gomoku.getGame(1);
      expect(game.status).to.equal(2); // Finished
      expect(game.winner).to.equal(player1.address);
    });
  });
});
