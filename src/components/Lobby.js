import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableHighlight,
} from 'react-native';

export default class Lobby extends Component<any, any> {
  constructor(props) {
    super(props);
    this.state = {
      pressCreateConfirm: false, // Set to true when the Create button is pressed
      pressJoinConfirm: false, // Set to true when the Join button is pressed
    };
  }

  onHideUnderlayCreateButton = () => {
    this.setState({pressCreateConfirm: false});
  };

  onShowUnderlayCreateButton = () => {
    this.setState({pressCreateConfirm: true});
  };

  onHideUnderlayJoinButton = () => {
    this.setState({pressJoinConfirm: false});
  };

  onShowUnderlayJoinButton = () => {
    this.setState({pressJoinConfirm: true});
  };

  render() {
    return (
      <View style={styles.contentContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            onChangeText={this.props.onChangeUsername}
            placeholder={' Enter your username'}
            maxLength={15}
            value={this.props.username}
          />
        </View>
        <View style={styles.container}>
          <View style={styles.buttonContainer}>
            <TouchableHighlight
              activeOpacity={1}
              underlayColor={'white'}
              style={
                this.state.pressCreateConfirm
                  ? styles.buttonPressed
                  : styles.buttonNotPressed
              }
              onHideUnderlay={this.onHideUnderlayCreateButton}
              onShowUnderlay={this.onShowUnderlayCreateButton}
              disabled={this.props.isDisabled}
              onPress={this.props.onPressCreateRoom}>
              <Text
                style={
                  this.state.pressCreateConfirm
                    ? styles.cancelPressed
                    : styles.cancelNotPressed
                }>
                Create
              </Text>
            </TouchableHighlight>
          </View>
          <View style={styles.buttonBorder} />
          <View style={styles.buttonContainer}>
            <TouchableHighlight
              activeOpacity={1}
              underlayColor={'white'}
              style={
                this.state.pressJoinConfirm
                  ? styles.buttonPressed
                  : styles.buttonNotPressed
              }
              onHideUnderlay={this.onHideUnderlayJoinButton}
              onShowUnderlay={this.onShowUnderlayJoinButton}
              onPress={this.props.onPressJoinRoom}>
              <Text
                style={
                  this.state.pressJoinConfirm
                    ? styles.cancelPressed
                    : styles.cancelNotPressed
                }>
                Join
              </Text>
            </TouchableHighlight>
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  container: {
    flexDirection: 'row',
    paddingLeft: 11,
    paddingRight: 11,
  },
  buttonContainer: {
    flex: 1,
    textAlign: 'center',
  },
  buttonBorder: {
    borderLeftWidth: 4,
    borderLeftColor: 'white',
  },
  textInput: {
    backgroundColor: '#FFF',
    height: 40,
    borderColor: '#CCC',
    borderWidth: 1,
  },
  buttonPressed: {
    borderColor: 'rgb(153, 0, 255)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
  },
  buttonNotPressed: {
    backgroundColor: 'rgb(153, 0, 255)',
    borderColor: 'rgb(153, 0, 255)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
  },
  cancelPressed: {
    color: 'rgb(153, 0, 255)',
    fontSize: 16,
    textAlign: 'center',
    alignItems: 'center',
  },
  cancelNotPressed: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    alignItems: 'center',
  },
});
