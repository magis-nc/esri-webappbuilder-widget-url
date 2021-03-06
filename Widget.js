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

/**
*	This widget for ESRI WebApp Builder deals with params URL and navigator history navigation
*/
define([
    'dojo/_base/declare',
    'jimu/BaseWidget',
    'dojo/on',
    'dojo/_base/lang',
	'esri/geometry/Point',
	'esri/geometry/Extent'
  ],
    function (
        declare,
        BaseWidget,
        on,
        lang,
        Point,
		Extent
	) {
        var clazz = declare([BaseWidget], {
			name: 'Url',
            baseClass: 'jimu-widget-url',
			inPanel: false,
			hasStyle:false,
			hasUIFile:false,

			initialExtent:{
				extent:false,
				scale:false
			},

            /**
             *  On startup
             */
			startup: function () {

				//Config
				this.extentTracking = (this.config.extent != false);
				if(this.extentTracking)
					this.extentTrackingMode = (this.config.extent ==2) ? 2 : 1;
				this.basemapTracking = (this.config.basemap !== false);
				this.widgets_sendData = (!this.config.widgetsData || this.config.widgetsData.send !== false);
				this.widgets_listenData = (!this.config.widgetsData || this.config.widgetsData.listen !== false);


				//Hitch (pass context for slots)
				this._trackNavigatorHistory = lang.hitch(this, this._trackNavigatorHistory);

				//Analyze URL
				this.analyze(true);

				//Init map extent tracking
				if(this.extentTracking)
					this._initMapTracking();

				//Init map extent tracking
				if(this.config.parseLayers)
					this._initLayers();

				//Init navigator return and forward in history tracking
				window.onpopstate = this._trackNavigatorHistory;

				//Listen to all widgets
				if(this.widgets_listenData)
					this.fetchData();

				//Send initial params
				if(this.widgets_sendData){
					this.publishData({
						"url-changed":{
							"params":this._CURRENT_URL.params,
							"url":this._CURRENT_URL.url,
							"type":"start"
						}
					});
				}
            },

			/**
			 *  Slot for communication from other widgets
			 *  This widget do something if data received have structure like { "toUrl" : {"params:{"var1":"toto", "debug":"true"}, "eraseMode" : false}}
			 *  NB : eraseMode in data.toUrl is optionnal. Default false. If true, params currently in URL are all deleted. If false, a param in current url is keeped as long as not provided in data.toUrl
			 */
			onReceiveData:function(widget_name, widget_id, data){
				if(!data.toUrl)
					return;

				var eraseMode = (data.toUrl.eraseMode && data.toUrl.eraseMode === true);
				var history_name = (data.toUrl.history === undefined) ? "" : data.toUrl.history;

				//remove params if asked
				if(data.toUrl.remove_params)
					this.removeParams(data.toUrl.remove_params, false);

				//Update Url params
				if(data.toUrl.params)
					this.updateParams(data.toUrl.params, eraseMode, history_name);
			},

			/**
			 *  Slot for change in navigation history
			 */
			_trackNavigatorHistory:function(event){
				if(event.state && ( (event.state.center && event.state.scale) || event.state.extent ) ){
					this.setExtentFromURL(event.state.center, event.state.scale,  event.state.extent);
				}
				else{
					this.setDefaultExtent();
				}
			},

			/**
			 *  Method to set default extent
			 */
			setDefaultExtent:function(){
				if(this.extentTrackingMode==1){
					if(!this.initialExtent.extent)
						return false;

					this._notTrackMap = true;

					var deferred = this.map.setExtent(this.initialExtent.extent);

					//Use defer to re-enable map tracking after centered
					deferred.then(lang.hitch(this, function(){this._notTrackMap=false;}));
				}
				else{
					if(!this.initialExtent.extent || !this.initialExtent.scale)
						return false;

					//Ask slot for map extent changing to do nothing !
					this._notTrackMap = true;

					//Set scale
					this.map.setScale(this.initialExtent.scale);

					//Center
					var pt = this.initialExtent.extent.getCenter();
					var deferred =this.map.centerAt(pt);

					//Use defer to re-enable map tracking after centered
					deferred.then(lang.hitch(this, function(){this._notTrackMap=false;}));


				}

				this.initialExtent={
					extent:this.map.extent,
					scale:this.map.getScale()
				};

			},


			/**
			*  Method to set extent from URL params
			*/
			setExtentFromURL:function(center_string, scale_string, extent_string){
				if(!center_string)
					center_string =  this.getParam("center");
				if(!scale_string)
					scale_string =  this.getParam("scale");
				if(!extent_string)
					extent_string =  this.getParam("extent");

				if(this.extentTrackingMode==1){
					if(!extent_string)
						return false;

					//Extent control
					var tab = extent_string.split(",");
					if(tab.length!=4 && tab.length!=5)
						return false;
					for(var i in tab){
						if(isNaN(tab[i]))
							return false;
					}

					//If wkid passed and wkid different from map do nothing
					if(tab[4] && this.map.spatialReference.wkid != tab[4])
						return false;

					//Ask slot for map extent changing to do nothing !
					this._notTrackMap = true;

					//Set extent
					var ext = new Extent(
						parseInt(tab[0]),
						parseInt(tab[1]),
						parseInt(tab[2]),
						parseInt(tab[3]),
						this.map.spatialReference
					);
					console.log(ext);
					var deferred = this.map.setExtent(ext);

					//Use defer to re-enable map tracking after centered
					deferred.then(this._enableMapTracking);

				}
				else{
					if(!center_string || !scale_string)
						return false;

					var p_c = center_string.split(",");
					var p_s = scale_string;

					if((p_c.length==2 || p_c.length==3) && !isNaN(p_c[0]) && !isNaN(p_c[1]) && !isNaN(p_s)){
						//If wkid passed and wkid different from map do nothing
						if(p_c[2] && p_c[2] != this.map.spatialReference.wkid)
							return false;

						//Ask slot for map extent changing to do nothing !
						this._notTrackMap = true;

						//Set scale
						this.map.setScale(p_s);

						//Center
						var pt = new Point(p_c[0], p_c[1], this.map.spatialReference);
						var deferred =this.map.centerAt(pt);

						//Use defer to re-enable map tracking after centered
						deferred.then(this._enableMapTracking);

					}
				}
			},

			_enableMapTracking:function(){
				this._notTrackMap=false;
			},

			/**
			 *  Init map extent tracking to add params in URL
			 */
			_initMapTracking:function(){
				//Add handle to map change-extent
				this._onMapExtentChange = lang.hitch(this, this._onMapExtentChange);
				this.map.on("extent-change", this._onMapExtentChange);
				this._enableMapTracking = lang.hitch(this, this._enableMapTracking);

				//Save current extent and scale
				this.initialExtent={
					extent:this.map.extent,
					scale:this.map.getScale()
				};

				//init extent from URL if not manage by wab (wab < 1.2 e.g. public 1.1 version)
				if(!wabVersion || parseFloat(wabVersion) < 1.2)
					this.setExtentFromURL();
			},

      /**
      * init layers visiblity from custom hide & show url parameters
      */
      _initLayers:function(){
        var hide = this.getParam("hide");
        var show = this.getParam("show");
        if(hide){
          hide = hide.split(";")
          for(var i=0,nb=hide.length;i<nb;i++){
            var id = hide[i];
            var l = this.map.getLayer(id);
            if(l) l.setVisibility(false);
          }
        }
        if(show){
          show = show.split(";")
          for(var i=0,nb=show.length;i<nb;i++){
            var tab = show[i].split(":");
            id = tab[0];
            var l = this.map.getLayer(id);
            if(l && l.setVisibleLayers && tab.length==2){
              var visibleLayers = tab[1].split(",");
              visibleLayers.forEach(function(value, index){
                visibleLayers[index] = parseInt(value);
              })
              l.setVisibleLayers(visibleLayers);
            }
            if(l) l.setVisibility(true);
          }
        }

      },

			/**
			 *  Slot for map extent change
			 */
			_notTrackMap:false,
			_onMapExtentChange:function(evt){
				if(this._notTrackMap || !this.extentTracking){
					return;
				}

				var extent = this.map.extent;
				if(this.extentTrackingMode==1){
					var extent_string =
						parseInt(extent.xmin).toString() + ","
						+ parseInt(extent.ymin).toString() + ","
						+ parseInt(extent.xmax).toString() + ","
						+ parseInt(extent.ymax).toString() + ","
						+ this.map.spatialReference.wkid;

					this.updateParam("extent", extent_string);
				}
				else{
					var center = extent.getCenter();
					var scale = this.map.getScale();

					this.updateParams({
						"center" : parseInt(center.x).toString()+","+parseInt(center.y).toString() + "," + + this.map.spatialReference.wkid,
						"scale" : scale
					});
				}
			},

			/**
			 *  Current URL description
			 */
            _CURRENT_URL: {
                "url": false,
                "base": false,
                "params": {}
            },

			/**
			 *  Get url
			 *  @param boolean force If true, reconstruct url from _CURRENT_URL
			 */
            get: function (force) {
                this.analyze();
                if (force) {
					var params_pair=[];
                    for (var name in this._CURRENT_URL.params)
						if(name)
							params_pair.push(encodeURIComponent(name) + "=" + encodeURIComponent(this._CURRENT_URL.params[name]));

                    this._CURRENT_URL.url = "?"+params_pair.join("&");
                }
                return this._CURRENT_URL.url;
            },

			/**
             * Analyze URL
             */
            analyze: function (force) {
                if (!force && this._CURRENT_URL["url"]) {
                    return this._CURRENT_URL;
                }
                this._CURRENT_URL.url = window.location.search;
                var params = {};
                var urlArr = this._CURRENT_URL.url.split("?");
                if (urlArr.length != 2) {
                    return null;
                }
                var parArr = urlArr[1].split("&");
                var l = parArr.length;
                for (var i = 0; i < l; i++) {
                    var parr = parArr[i].split("=");
                    if (parr.length < 2)
                        continue;
                    this._CURRENT_URL.params[parr[0]] = decodeURIComponent(parr[1]);
                }
                return this._CURRENT_URL;
            },
            paramExists: function (param_name) {
                this.analyze();
                return (this._CURRENT_URL["params"][param_name] !== undefined);
            },
            paramsExists: function (params_names) {
                this.analyze();
				//If method param is not an array, transform it !
                if (!Array.isArray(params_names))
                    params_names = [params_names];
                //We control that all params exist
                var all_exists = true;
                for (var i in params_names) {
                    if (this._CURRENT_URL.params[params_names[i]] === undefined)
                        all_exists = false;
                }
                return all_exists;
            },
            getParam: function (param_name) {
                this.analyze();
                return this._CURRENT_URL.params[param_name];
            },
            getParams: function () {
                this.analyze();
                return this._CURRENT_URL.params;
            },
			_update:function(history_name){
				var url = this.get(true);
				if(!history_name && history_name!== false)
					history_name = "";

				if(this.widgets_sendData){
					this.publishData({
						"url-changed":{
							"params":this._CURRENT_URL.params,
							"url":this._CURRENT_URL.url,
							"type":"update"
						}
					});
				}

				// Push in wab url params object
				if(window.queryObject)
					window.queryObject = this._CURRENT_URL.params;

				if(!window.history || !window.history.pushState || history_name===false)
					return false;

				//Push in browser history
				window.history.pushState(this._CURRENT_URL.params, history_name, url);



				return url;
			},
            updateParam: function (param_name, param_value, history_name) {
                this.analyze();
                if (!param_name || !param_value)
                    return;
                this._CURRENT_URL.params[param_name] = param_value;

				return this._update(history_name);
            },
            updateParams: function (params_object, erase_all, history_name) {
                this.analyze();
                if (erase_all === true)
                    this._CURRENT_URL.params = {};
                for (var param_name in params_object) {
                    this._CURRENT_URL.params[param_name] = params_object[param_name];
                }
                return this._update(history_name);
            },
			removeParams:function(params, history_name){
				if(!Array.isArray(params))
					params = [params];
				for(var i in params){
					var param = params[i];
					if(this._CURRENT_URL.params[param])
						delete(this._CURRENT_URL.params[param]);
				}
				return this._update(history_name);
			}
        });

        return clazz;
    });
