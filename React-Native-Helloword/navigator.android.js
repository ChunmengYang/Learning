import React, {
  Component,
} from 'react';

import {
	Navigator,
	BackAndroid
} from 'react-native';

import {
	MovieView
} from './moive.android.js'

var NavigatorView = React.createClass({

    configureScene(route){
      return Navigator.SceneConfigs.FloatFromRight;
    },

    renderScene(router, navigator){
      var Component = null;this._navigator = navigator;
      switch(router.name){
        case "welcome":
          Component = require('./welcome');
          break;
        case "movie":
          Component = MovieView;
          break;
        default:
          Component = require('./welcome');
      }

      return <Component navigator={navigator} />
    },

    componentDidMount() {
		var navigator = this._navigator;
		navigator.navigationContext.addListener('didfocus', function() {
			if (navigator && navigator.getCurrentRoutes().length > 1) {
				global.currentNavigator = navigator;
		    } else {
				global.currentNavigator = this.props.navigator;
			}
		}.bind(this));
    },

    componentWillUnmount() {
		
    },

    render() {
        return (
            <Navigator
                initialRoute={{name: 'welcome'}}
                configureScene={this.configureScene}
                renderScene={this.renderScene} />
        );
    }

});

module.exports = NavigatorView;