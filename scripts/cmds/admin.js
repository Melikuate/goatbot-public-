const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");


function applyFont(text) {
  const fontMap = {
    'A': '𝑨', 'B': '𝑩', 'C': '𝑪', 'D': '𝑫', 'E': '𝑬',
    'F': '𝑭', 'G': '𝑮', 'H': '𝑯', 'I': '𝑰', 'J': '𝑱',
    'K': '𝑲', 'L': '𝑳', 'M': '𝑴', 'N': '𝑵', 'O': '𝑶',
    'P': '𝑷', 'Q': '𝑸', 'R': '𝑹', 'S': '𝑺', 'T': '𝑻',
    'U': '𝑼', 'V': '𝑽', 'W': '𝑾', 'X': '𝑿', 'Y': '𝒀',
    'Z': '𝒁'
  };
  return text.split('').map(char => fontMap[char] || char).join('');
}

module.exports = {
  config: {
    name: "admin",
    version: "1.7",
    author: "Nicolas tesla",
    countDown: 5,
    role: 2,
    description: {
      en: "Admin management"
    },
    category: "admin",
    guide: {
      en: "{pn} add [uid]\n{pn} remove [uid]\n{pn} list"
    }
  },

  langs: {
    en: {
      added: "✅ Added admin for %1 user(s):\n%2",
      alreadyAdmin: "⚠️ %1 user(s) already admin:\n%2",
      missingIdAdd: "⚠️ Please specify user ID",
      removed: "✅ Removed admin for %1 user(s):\n%2",
      notAdmin: "⚠️ %1 user(s) not admin:\n%2",
      missingIdRemove: "⚠️ Please specify user ID",
      listAdmin: "👑 Admin list:\n%1"
    }
  },

  onStart: async function ({ message, args, usersData, event, getLang }) {
    const formatSupremeAdmin = (user) => {
      return `${applyFont("╭─⌾ADMIN SUPRÊME⋅⌾──╮")}
│
│ • ${user.name} (${user.uid})
│
╰─────────────⌾`;
    };

    const formatNormalAdmin = (user) => {
      return `${applyFont("╭─⌾ADMIN USER⋅⌾──╮")}
│
│ • ${user.name} (${user.uid})
│
╰─────────────⌾`;
    };

    switch (args[0]) {
      case "add":
      case "-a": {
        if (!args[1]) return message.reply(getLang("missingIdAdd"));
        
        let uids = [];
        if (Object.keys(event.mentions).length > 0) {
          uids = Object.keys(event.mentions);
        } else if (event.messageReply) {
          uids.push(event.messageReply.senderID);
        } else {
          uids = args.slice(1).filter(arg => !isNaN(arg));
        }

        const { added, existing } = uids.reduce((acc, uid) => {
          if (config.adminBot.includes(uid)) {
            acc.existing.push(uid);
          } else {
            acc.added.push(uid);
          }
          return acc;
        }, { added: [], existing: [] });

        if (added.length > 0) {
          config.adminBot.push(...added);
          writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
        }

        const getNames = async (ids) => {
          return Promise.all(ids.map(uid => 
            usersData.getName(uid).then(name => `• ${name} (${uid})`)
          ));
        };

        let response = [];
        if (added.length > 0) {
          const names = await getNames(added);
          response.push(getLang("added", added.length, names.join("\n")));
        }
        if (existing.length > 0) {
          const names = await getNames(existing);
          response.push(getLang("alreadyAdmin", existing.length, names.join("\n")));
        }

        return message.reply(response.join("\n\n"));
      }

      case "remove":
      case "-r": {
        if (!args[1]) return message.reply(getLang("missingIdRemove"));
        
        let uids = [];
        if (Object.keys(event.mentions).length > 0) {
          uids = Object.keys(event.mentions);
        } else {
          uids = args.slice(1).filter(arg => !isNaN(arg));
        }

        const { removed, notAdmin } = uids.reduce((acc, uid) => {
          const index = config.adminBot.indexOf(uid);
          if (index !== -1) {
            acc.removed.push(uid);
            config.adminBot.splice(index, 1);
          } else {
            acc.notAdmin.push(uid);
          }
          return acc;
        }, { removed: [], notAdmin: [] });

        if (removed.length > 0) {
          writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));
        }

        const getNames = async (ids) => {
          return Promise.all(ids.map(uid => 
            usersData.getName(uid).then(name => `• ${name} (${uid})`)
          ));
        };

        let response = [];
        if (removed.length > 0) {
          const names = await getNames(removed);
          response.push(getLang("removed", removed.length, names.join("\n")));
        }
        if (notAdmin.length > 0) {
          response.push(getLang("notAdmin", notAdmin.length, notAdmin.map(uid => `• ${uid}`).join("\n")));
        }

        return message.reply(response.join("\n\n"));
      }

      case "list":
      case "-l": {
        if (config.adminBot.length === 0) {
          return message.reply("No admins configured");
        }

        const users = await Promise.all(
          config.adminBot.map(uid => 
            usersData.getName(uid).then(name => ({ uid, name }))
          )
        );

        const adminList = users.map((user, index) => 
          index === 0 ? formatSupremeAdmin(user) : formatNormalAdmin(user)
        );

        return message.reply(adminList.join("\n"));
      }

      default:
        return message.SyntaxError();
    }
  }
};
