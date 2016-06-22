import React, {
  Component,
} from 'react';

import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

var WelcomeView = React.createClass({
    onPressFeed() {
        this.props.navigator.push({name: 'movie'});
    },

    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.welcome} onPress={this.onPressFeed} >
                    This is welcome view.Tap to go to feed view.
                </Text>
            </View>
        );
    }

});

var styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	welcome: {
		fontSize: 30,
		textAlign: 'center',
		margin: 10,
	},
});

module.exports = WelcomeView;