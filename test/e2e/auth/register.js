module.exports = {
  register: (browser) => {
    browser
      .url(`${browser.launch_url}/register`)
      .waitForElementVisible('body', 1000)
      .setValue('input[name=email]', 'test@register.ru')
      .setValue('input[name=password]', 'test@register.ru')
      .setValue('input[name=repeatPassword]', 'test@register.ru')
      .click('button[type=submit]')
      .pause(1000)
      .assert.urlContains('dashboard')
      .end();
  },
};
