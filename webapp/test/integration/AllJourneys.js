jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
		"sap/ui/test/Opa5",
		"com/sap/genericui5/test/integration/pages/Common",
		"sap/ui/test/opaQunit",
		"com/sap/genericui5/test/integration/pages/Worklist",
		"com/sap/genericui5/test/integration/pages/Object",
		"com/sap/genericui5/test/integration/pages/NotFound",
		"com/sap/genericui5/test/integration/pages/Browser",
		"com/sap/genericui5/test/integration/pages/App"
	], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "com.sap.genericui5.view."
	});

	sap.ui.require([
		"com/sap/genericui5/test/integration/WorklistJourney",
		"com/sap/genericui5/test/integration/ObjectJourney",
		"com/sap/genericui5/test/integration/NavigationJourney",
		"com/sap/genericui5/test/integration/NotFoundJourney",
		"com/sap/genericui5/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});