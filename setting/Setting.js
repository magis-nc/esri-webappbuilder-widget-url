///////////////////////////////////////////////////////////////////////////
// Copyright © 2015 MAGIS. All Rights Reserved.
//
// Licensed under the GPL licence Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    https://github.com/magis-nc/esri-webappbuilder-widget-url/blob/master/LICENSE
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    "dojo/_base/lang",
    'dojo/_base/html',
    "dojo/Deferred",
    'dojo/on',
    'dojo/aspect',
    'dojo/cookie',
    'dojo/sniff',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting'
  ],
  function(
    declare,
    lang,
    html,
    Deferred,
    on,
    aspect,
    cookie,
    has,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting) {
    
	return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'jimu-widget-url-setting',

      startup: function() {
        this.inherited(arguments);
        if (!this.config) {
          this.config = {
			"extent":1,
			"widgetsData":{
				"send":true,
				"listen":true
			}
		  };
        }

        this.setConfig(this.config);
      },


      setConfig: function(config) {
        this.config = config;
		
		var extent = config.extent.toString();
		switch(config.extent){
			case "2" :
				break;
			case "0":
				break;
			default:
				extent = "0";
				break;		
		}
		console.log("set option extent : "+config.extent + " -> " +extent);
		
		
		var sendData = (!config.widgetsData || config.widgetsData.send !== false);
		var listenData = (!config.widgetsData || config.widgetsData.listen !== false);
		
		//Select extent option
		var extent_nb_options = this.extentNode.options.length;
		for(var i=0; i < extent_nb_options; i++)
		{
		  if(this.extentNode.options[i].value == extent)
			this.extentNode.selectedIndex = i;
		}
		
		this.publishDataNode.checked = sendData;
		this.listenDataNode.checked = listenData;
		
      },

      getConfig: function() {
		this.config = {
			extent:this.extentNode.options[this.extentNode.selectedIndex].value,
			widgetsData : {
				send:this.publishDataNode.checked,
				listen:this.listenDataNode.checked,
			}
		};
        return this.config;
      }
    });
  });