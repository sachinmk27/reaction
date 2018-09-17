import Random from "@reactioncommerce/random";
import { Accounts } from "meteor/accounts-base";
import { Template } from "meteor/templating";
import { $ } from "meteor/jquery";
import { Blaze } from "meteor/blaze";
import { ReactiveVar } from "meteor/reactive-var";
import { i18next } from "/client/api";
import { LoginFormSharedHelpers } from "../../helpers";
import { getComponent } from "/imports/plugins/core/components/lib";
import { LoginFormValidation } from "/lib/api";

/**
 * Accounts Event: onEnrollmentLink When a user uses an enrollment link
 */
Accounts.onEnrollmentLink((token, done) => {
  Blaze.renderWithData(Template.loginFormUpdatePasswordOverlay, {
    token,
    callback: done,
    isOpen: true,
    type: "setPassword"
  }, $("body").get(0));
});


// ----------------------------------------------------------------------------
// /**
//  * Helpers: Login Form Update Password Overlay
//  */
Template.loginFormUpdatePasswordOverlay.helpers({
  component() {
    let currentData = { isOpen: true, type: "updatePassword" }; // TODO: Edit
    if (Object.keys(Template.currentData()).length) {
      currentData = Template.currentData();
    }
    return {
      ...currentData,
      component: getComponent("UpdatePasswordOverlay")
    };
  }
});

// ----------------------------------------------------------------------------

/**
 * onCreated: Login Form Change Password
 */
Template.loginFormChangePassword.onCreated(() => {
  const template = Template.instance();

  template.uniqueId = Random.id();
  template.formMessages = new ReactiveVar({});
});

/**
 * Helpers: Login Form Change Password
 */
Template.loginFormChangePassword.helpers(LoginFormSharedHelpers);

/**
 * Events: Login Form Change Password
 */
Template.loginFormChangePassword.events({
  "submit form"(event, template) {
    event.preventDefault();
    event.stopPropagation();

    const oldPasswordInput = template.$(".login-input--oldPassword");
    const passwordInput = template.$(".login-input--password");

    const oldPassword = oldPasswordInput.val().trim();
    const password = passwordInput.val().trim();

    // We only check if it exists, just incase we"ve change the password strength and want the
    // user to have an oppurtinity to update to a stronger password
    const validatedOldPassword = LoginFormValidation.password(password, { validationLevel: "exists" });
    const validatedPassword = LoginFormValidation.password(password);

    const templateInstance = Template.instance();
    const errors = {};

    templateInstance.formMessages.set({});


    if (validatedOldPassword !== true) {
      errors.oldPassword = validatedOldPassword;
    }

    if (validatedPassword !== true) {
      errors.password = validatedPassword;
    }

    if ($.isEmptyObject(errors) === false) {
      templateInstance.formMessages.set({
        errors
      });
      // prevent password update
      return;
    }

    Accounts.changePassword(oldPassword, password, (error) => {
      if (error) {
        // Show some error message
        templateInstance.formMessages.set({
          alerts: [error]
        });
      } else {
        // // Close dropdown or navigate to page
        templateInstance.formMessages.set({
          info: [{
            reason: i18next.t("accountsUI.info.passwordChanged")
          }]
        });
      }
    });
  }
});
