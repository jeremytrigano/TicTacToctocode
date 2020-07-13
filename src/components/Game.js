import React, {Component} from 'react';
import {StyleSheet, Text, View, TouchableHighlight, Alert} from 'react-native';
import range from 'lodash';
const _ = range;
export default class Game extends Component {
  constructor(props) {
    super(props);

    // Winning combinations
    this.possibleCombinations = [
      [0, 3, 6],
      [1, 4, 7],
      [0, 1, 2],
      [3, 4, 5],
      [2, 5, 8],
      [6, 7, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    // Corresponds to the square number on the table
    this.ids = [[0, 1, 2], [3, 4, 5], [6, 7, 8]];

    // For the 3x3 table
    this.rows = [_.range(3).fill(''), _.range(3).fill(''), _.range(3).fill('')];

    this.state = {
      moves: _.range(9).fill(''),
      xScore: 0,
      oScore: 0,
    };
    this.turn = 'X'; // Changes every time a player makes a move
    this.gameOver = false; // Set to true when the game is over
    this.count = 0; // used to check if the game ends in a draw
  }

  componentDidMount() {
    // Listen for messages in the channel
    // this.props.pubnub.getMessage(this.props.channel, msg => {
    this.props.pubnub.addListener({
      message: ({channel, message, publisher}) => {
        if (channel === this.props.channel) {
          // Add the other player's move to the table
          if (message.turn === this.props.piece) {
            let moves = this.state.moves;
            let id = this.ids[message.row][message.col];
            moves[id] = message.piece;

            this.setState({
              moves,
            });
            this.turn = message.turn;
            this.updateScores.call(this, moves);
          }
          if (message.reset) {
            this.setState({
              moves: _.range(9).fill(''),
            });
            this.turn = 'X';
            this.gameOver = false;
          }
          if (message.gameOver) {
            this.props.pubnub.unsubscribe({
              channels: [this.props.channel],
            });
            this.props.endGame();
          }
        }
      },
    });
  }

  generateRows = () => {
    return this.rows.map((row, colIndex) => {
      return (
        <View style={styles.row} key={colIndex}>
          {this.generateBlocks(row, colIndex)}
        </View>
      );
    });
  };

  generateBlocks = (row, rowIndex) => {
    return row.map((block, colIndex) => {
      let id = this.ids[rowIndex][colIndex];
      return (
        <TouchableHighlight
          key={colIndex}
          onPress={this.onMakeMove.bind(this, rowIndex, colIndex)}
          underlayColor={'#CCC'}
          style={styles.block}>
          <Text style={styles.blockText}>{this.state.moves[id]}</Text>
        </TouchableHighlight>
      );
    });
  };

  onMakeMove(rowIndex, colIndex) {
    let moves = this.state.moves;
    let id = this.ids[rowIndex][colIndex];
    // Check that the square is empty
    if (!moves[id] && this.turn === this.props.piece) {
      moves[id] = this.props.piece;

      this.setState({
        moves,
      });
      // Change the turn so the next player can make a move
      this.turn = this.turn === 'X' ? 'O' : 'X';

      // Publish the data to the game channel
      this.props.pubnub.publish({
        message: {
          row: rowIndex,
          col: colIndex,
          piece: this.props.piece,
          isRoomCreator: this.props.isRoomCreator,
          turn: this.turn,
        },
        channel: this.props.channel,
      });
      this.updateScores.call(this, moves);
    }
  }

  updateScores = moves => {
    // Iterate the double array possibleCombinations to check if there is a winner
    for (let i = 0; i < this.possibleCombinations.length; i++) {
      const [a, b, c] = this.possibleCombinations[i];
      if (moves[a] && moves[a] === moves[b] && moves[a] === moves[c]) {
        this.determineWinner(moves[a]);
        break;
      }
    }
    this.count++;
    // Check if the game ends in a draw
    if (this.count === 9) {
      this.gameOver = true;
      this.newGame();
    }
  };

  determineWinner = winner => {
    var pieces = {
      X: this.state.xScore,
      O: this.state.oScore,
    };
    // Update score for the winner
    if (winner === 'X') {
      pieces['X'] += 1;
      this.setState({
        xScore: pieces['X'],
      });
    } else {
      pieces['O'] += 1;
      this.setState({
        oScore: pieces['O'],
      });
    }
    // End the game once there is a winner
    this.gameOver = true;
    this.newGame();
  };

  newGame = () => {
    // Show this alert if the player is not the room creator
    if (this.props.isRoomCreator === false && this.gameOver) {
      Alert.alert('Game Over', 'Waiting for rematch...');
      this.turn = 'X'; // Set turn to X so opponent can't make a move
    }
    // Show this alert to the room creator
    else if (this.props.isRoomCreator && this.gameOver) {
      Alert.alert(
        'Game Over!',
        'Do you want to play another round?',
        [
          {
            text: 'No',
            onPress: () => {
              this.props.pubnub.publish({
                message: {
                  gameOver: true,
                },
                channel: this.props.channel,
              });
            },
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: () => {
              this.props.pubnub.publish({
                message: {
                  reset: true,
                },
                channel: this.props.channel,
              });
            },
          },
        ],
        {cancelable: false},
      );
    }
  };

  render() {
    return (
      <View style={styles.tableContainer}>
        <View style={styles.table}>{this.generateRows()}</View>
        <View style={styles.scoresContainer}>
          <View style={styles.score}>
            <Text style={styles.userScore}>{this.state.xScore}</Text>
            <Text style={styles.username}>{this.props.xUsername} (X)</Text>
          </View>

          <View style={styles.score}>
            <Text style={styles.userScore}>{this.state.oScore}</Text>
            <Text style={styles.username}>{this.props.oUsername} (O)</Text>
          </View>
        </View>
      </View>
    );
  }
}
const styles = StyleSheet.create({
  tableContainer: {
    flex: 9,
  },
  table: {
    flex: 7,
    flexDirection: 'column',
    color: 'black',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  block: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'black',
  },
  scoresContainer: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  score: {
    flex: 1,
    alignItems: 'center',
  },
  userScore: {
    fontSize: 25,
    fontWeight: 'bold',
    color: 'black',
  },
  username: {
    fontSize: 20,
    color: 'black',
  },
});
