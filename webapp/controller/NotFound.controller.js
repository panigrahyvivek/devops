sap.ui.define([
		"com/sap/genericui5/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("com.sap.genericui5.controller.NotFound", {

			/**
			 * Navigates to the worklist when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("worklist");
			}

		});

	}
);