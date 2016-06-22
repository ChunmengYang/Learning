/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */

import React, {
  Component,
} from 'react';

import {
	AppRegistry,
	Alert,
　　View,
　　Navigator,
　　Text,
　　BackAndroid,
　　StyleSheet
} from 'react-native'; 

var DefaultView = React.createClass({
	onPressFeed() {
        this.props.navigator.push({name: 'navigator'});
    },
	
    render(){
      return (
          <View style={styles.container}>
              <Text style={styles.welcome} onPress={this.onPressFeed}>Default view</Text>
          </View>
      )
    }
});

var SampleApp = React.createClass({

    configureScene(route){
      return Navigator.SceneConfigs.FloatFromRight;
    },

    renderScene(router, navigator){
      var Component = null;this._navigator = navigator;
      switch(router.name){
        case "default":
          Component = DefaultView;
          break;
        case "navigator":
          Component = require('./navigator');
          break;
        default:
          Component = DefaultView;
      }

      return <Component navigator={navigator} />
    },

    componentDidMount() {
      global.currentNavigator = this._navigator;
      BackAndroid.addEventListener('hardwareBackPress', function() {
		  var navigator = global.currentNavigator;
          if (navigator && navigator.getCurrentRoutes().length > 1) {
            navigator.pop();
            return true;
          }
		  BackAndroid.exitApp();
          return false;
		  
      });
	  
	  //eval('alert("title","Hello!!!")');
    },


    componentWillUnmount() {
      BackAndroid.removeEventListener('hardwareBackPress');
    },

    render() {
        return (
            <Navigator
                initialRoute={{name: 'default'}}
                configureScene={this.configureScene}
                renderScene={this.renderScene} />
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

AppRegistry.registerComponent('AwesomeProject', () => SampleApp);
