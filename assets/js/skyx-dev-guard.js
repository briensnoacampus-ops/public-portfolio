/* =========================================================
 * SKYX GAMES - Developer Console Notice
 * Proprietary Infrastructure & Trademark Protection
 * ========================================================= */
(function () {
  console.clear();

  const styles = {
    ascii: "color: #D4AF37; font-family: monospace; font-weight: bold; font-size: 11px; line-height: 1.1;",
    alert: "font-family: monospace; font-size: 13px; font-weight: bold; color: #FF3333; background: #1A0000; border: 1px solid #FF3333; border-radius: 4px; display: inline-block;",
    title: "font-family: monospace; font-size: 12px; font-weight: bold; color: #D4AF37; background: #0A0A0A; border-left: 3px solid #D4AF37;",
    text: "font-family: sans-serif; font-size: 12px; color: #CCCCCC; line-height: 1.6;",
    brand: "font-family: monospace; font-weight: bold; color: #FFFFFF; background: #222222; padding: 3px 8px; border-radius: 3px;"
  };

  const asciiArt = `
   ███    █   █   █   █   █   █    ████    ███    █   █   ████   ███ 
  █       █  █     █ █     █ █    █       █   █   ██ ██   █     █    
   ███    ███       █       █     █  ██   █████   █ █ █   ███    ███ 
      █   █  █      █      █ █    █   █   █   █   █   █   █         █
  ████    █   █     █     █   █    ███    █   █   █   █   ████  ████ 
  `;

  const warningText = `%c${asciiArt}

%c🛑  STOP ! HOLD UP ! WHAT ARE YOU DOING HERE?  🛑

%cThis console is a feature intended solely for developers and administrators.

%cℹ️ INFRASTRUCTURE & PROTECTION
%c• Our web infrastructure is static, monitored, and proprietary.
• SKYX GAMES® and its associated logos/content are protected trademarks.
• All rights reserved. Unauthorized scraping or code reproduction is strictly prohibited.

%cSkyX Games Ecosystem © ${new Date().getFullYear()}. All rights reserved.
Signed by SkyXen ;)
`;

  console.log(
    warningText,
    styles.ascii,
    styles.alert,
    styles.text,
    styles.title,
    styles.text,
    styles.brand
  );
})();