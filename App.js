import React, {Component} from 'react';
import PubNub from 'pubnub';
import {Platform, StyleSheet, View, Alert, Text} from 'react-native';

import Game from './src/components/Game';
import Lobby from './src/components/Lobby';
import shortid from 'shortid';
import Spinner from 'react-native-spinkit';
import prompt from 'react-native-prompt-android';

import {YellowBox} from 'react-native';
YellowBox.ignoreWarnings(['Setting a timer']);

export default class App extends Component {
  constructor(props) {
    super(props);
    this.UniqueID = PubNub.generateUUID();
    this.pubnub = new PubNub({
      publishKey: 'your-publishKey',
      subscribeKey: 'your-subscribeKey',
      uuid: this.UniqueID,
    });
    this.state = {
      username: '',
      piece: '', // Creator of the room is 'X' and the opponent is 'O'
      xUsername: '', // Username for the room creator
      oUsername: '', // Username for the opponent
      isPlaying: false, // True when the opponent joins a room channel
      isWaiting: false, // True when the room creator waits for an opponent
      isRoomCreator: false,
      isDisabled: false, // True when the 'Create' button is pressed
    };
    this.channel = '';
  }

  componentDidMount() {
    this.pubnub.subscribe({
      channels: ['gameLobby'],
    });
    this.pubnub.addListener({
      message: ({channel, message, publisher}) => {
        if (channel === 'gameLobby') {
          if (message.isRoomCreator) {
            this.setState({
              xUsername: message.username,
            });
          } else if (message.notRoomCreator) {
            this.pubnub.unsubscribe({
              channels: ['gameLobby'],
            });
            // Start the game
            this.setState({
              oUsername: message.username,
              isWaiting: false,
              isPlaying: true,
            });
          }
        }
      },
    });
  }

  componentWillUnmount() {
    this.pubnub.unsubscribe({
      channels: ['gameLobby', this.channel],
    });
  }

  onChangeUsername = username => {
    this.setState({username});
  };

  onPressCreateRoom = () => {
    if (this.state.username === '') {
      Alert.alert('Error', 'Please enter a username');
    } else {
      let roomId = (
        Math.floor(Math.random() * (9999 - 1000)) + 1000
      ).toString();
      // let roomId = shortid.generate(); // Random channel name generated
      // let shorterRoomId = roomId.substring(0, 5); // Truncate to a shorter string value
      // roomId = shorterRoomId;
      this.channel = 'tictactoe-' + roomId;
      this.pubnub.subscribe({
        channels: [this.channel],
        withPresence: true,
      });

      // alert the room creator to share the room ID with their friend
      Alert.alert(
        'Share this room ID with your friend',
        roomId,
        [{text: 'Done'}],
        {cancelable: false},
      );
      this.setState({
        piece: 'X',
        isRoomCreator: true,
        isWaiting: true,
        isDisabled: true,
      });
      this.pubnub.publish({
        message: {
          isRoomCreator: true,
          username: this.state.username,
        },
        channel: 'gameLobby',
      });
    } // Close the else statement
  };

  onPressJoinRoom = () => {
    if (this.state.username === '') {
      Alert.alert('Error', 'Please enter a username');
    } else {
      // Check for platform
      if (Platform.OS === 'android') {
        prompt(
          'Enter the room name',
          '',
          [
            {
              text: 'Cancel',
              onPress: () => console.log('Cancel Pressed'),
              style: 'cancel',
            },
            {
              text: 'OK',
              onPress: value => (value === '' ? '' : this.joinRoom(value)),
            },
          ],
          {
            type: 'default',
            cancelable: false,
            defaultValue: '',
            placeholder: '',
          },
        );
      } else {
        Alert.prompt(
          'Enter the room name',
          '',
          [
            {
              text: 'Cancel',
              onPress: () => console.log('Cancel Pressed'),
              style: 'cancel',
            },
            {
              text: 'OK',
              onPress: value => (value === '' ? '' : this.joinRoom(value)),
            },
          ],
          'plain-text',
        );
      }
    }
  };

  joinRoom = roomId => {
    this.channel = 'tictactoe-' + roomId;
    // Check that the lobby is not full
    this.pubnub
      .hereNow({
        channels: [this.channel],
      })
      .then(response => {
        // If totalOccupancy is less than or equal to 1, then the player can't join a room since it has not been created
        if (response.totalOccupancy < 1) {
          Alert.alert(
            'Lobby is empty',
            'Please create a room or wait for someone to create a room to join.',
          );
        }
        // Room is available to join
        else if (response.totalOccupancy < 2) {
          this.pubnub.subscribe({
            channels: [this.channel],
            withPresence: true,
          });

          this.setState({
            piece: 'O',
          });

          this.pubnub.publish({
            message: {
              readyToPlay: true, // Game can now start
              notRoomCreator: true,
              username: this.state.username,
            },
            channel: 'gameLobby',
          });
        }
        // Room already has two players
        else {
          Alert.alert('Room full', 'Please enter another room name');
        }
      })
      .catch(error => {
        console.log(error);
      });
  };

  endGame = () => {
    // Reset the state values
    this.setState({
      username: '',
      rivalUsername: '',
      isPlaying: false,
      isWaiting: false,
      isDisabled: false,
    });
    // Subscribe to gameLobby again on a new game
    this.channel = null;
    this.pubnub.subscribe({
      channels: ['gameLobby'],
      withPresence: true,
    });
  };

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Tic-Tac-Toctocode</Text>
        </View>
        <Spinner
          isVisible={this.state.isWaiting}
          size={75}
          type={'Circle'}
          color={'rgb(153, 0, 255)'}
        />
        {!this.state.isPlaying && (
          <Lobby
            username={this.state.username}
            onChangeUsername={this.onChangeUsername}
            onPressCreateRoom={this.onPressCreateRoom}
            onPressJoinRoom={this.onPressJoinRoom}
            isDisabled={this.state.isDisabled}
          />
        )}

        {this.state.isPlaying && (
          <Game
            pubnub={this.pubnub}
            channel={this.channel}
            username={this.state.username}
            piece={this.state.piece}
            xUsername={this.state.xUsername}
            oUsername={this.state.oUsername}
            isRoomCreator={this.state.isRoomCreator}
            endGame={this.endGame}
          />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  spinner: {
    flex: 1,
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 50,
  },
  titleContainer: {
    flex: 1,
    marginTop: 18,
  },
  title: {
    alignSelf: 'center',
    fontWeight: 'bold',
    fontSize: 30,
    color: 'rgb(153, 0, 255)',
  },
});
