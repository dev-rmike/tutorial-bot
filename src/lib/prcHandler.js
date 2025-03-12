// This is my custom made PRC API handler, you are allowed to use this for non-commercial. There is no exact explanation for all the code since it would be a lot.

const prcApi = {
  queue: [],
  lastRequest: null,
  processing: false,
};

const prcCache = {
  players: {
    data: null,
    lastUpdated: 0,
  },
  vehicles: {
    data: null,
    lastUpdated: 0,
  },
  joinlogs: {
    data: null,
    lastUpdated: 0,
  },
  queue: {
    data: null,
    lastUpdated: 0,
  },
  killlogs: {
    data: null,
    lastUpdated: 0,
  },
  commandlogs: {
    data: null,
    lastUpdated: 0,
  },
  modcalls: {
    data: null,
    lastUpdated: 0,
  },
  bans: {
    data: null,
    lastUpdated: 0,
  },
  info: {
    data: null,
    lastUpdated: 0,
  },
};

class Prc {
  static async getData(c, d) {
    if (d.endpoint === "command") {
      return new Promise((resolve, reject) => {
        prcApi.queue.push({ c, d, resolve, reject });
        this.fetchFromApi();
      });
    }
    if (d.endpoint === "info") {
      if (
        prcCache[d.endpoint].data &&
        Date.now() - prcCache[d.endpoint].lastUpdated <= 60000
      ) {
        return prcCache[d.endpoint].data;
      }
      d.endpoint = "";
      return new Promise((resolve, reject) => {
        prcApi.queue.push({ c, d, resolve, reject });
        this.fetchFromApi();
      });
    }
    if (!d.amount) {
      if (
        prcCache[d.endpoint].data &&
        Date.now() - prcCache[d.endpoint].lastUpdated <= 60000
      ) {
        return prcCache[d.endpoint].data;
      }
      return new Promise((resolve, reject) => {
        prcApi.queue.push({ c, d, resolve, reject });
        this.fetchFromApi();
      });
    }

    const data = {};
    for (let i = 0; i < d.amount; i++) {
      const endpointKey = i + 1;
      const endpoint = d[endpointKey].endpoint;
      if (
        prcCache[endpoint].data &&
        Date.now() - prcCache[endpoint].lastUpdated <= 60000
      ) {
        data[i] = prcCache[endpoint].data;
      } else {
        data[i] = await new Promise((resolve, reject) => {
          prcApi.queue.push({ c, d: d[endpointKey], resolve, reject });
          this.fetchFromApi();
        });
      }
    }
    return data;
  }

  static async fetchFromApi() {
    if (prcApi.processing) return;
    prcApi.processing = true;

    while (prcApi.queue.length > 0) {
      const { c, d, resolve, reject } = prcApi.queue.shift();
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      const currentTime = Date.now();
      if (prcApi.lastRequest && currentTime - prcApi.lastRequest < 6500) {
        const waitTime = 6500 - (currentTime - prcApi.lastRequest);
        await wait(waitTime);
      }
      prcApi.lastRequest = Date.now();
      if (d.method === "POST") {
        const endpoint = d.endpoint;
        const body = d.body;
        fetch(`https://api.policeroleplay.community/v1/server/${endpoint}`, {
          method: "POST",
          headers: {
            Authorization: "",
            "Server-Key": `${process.env.PRC_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        })
          .then((response) => response.json())
          .then((data) => {
            resolve(data);
          })
          .catch((error) => {
            if (d.retry) {
              reject(error);
            } else {
              d.retry = true;
              prcApi.queue.push({ c, d, resolve, reject });
              this.fetchFromApi();
            }
          });
      } else if (d.method === "GET") {
        const endpoint = d.endpoint;
        fetch(`https://api.policeroleplay.community/v1/server/${endpoint}`, {
          method: "GET",
          headers: {
            Authorization: "",
            "Server-Key": `${process.env.PRC_KEY}`,
          },
        })
          .then((response) => response.json())
          .then((data) => {
            resolve(data);
            prcCache[d.endpoint].data = data;
            prcCache[d.endpoint].lastUpdated = Date.now();
          })
          .catch((error) => {
            if (d.retry) {
              reject(error);
            } else {
              d.retry = true;
              prcApi.queue.push({ c, d, resolve, reject });
              this.fetchFromApi();
            }
          });
      }
      prcApi.processing = false;
    }
  }

  static async command(cmd) {
    const data = await this.getData("c", {
      endpoint: "command",
      method: "POST",
      body: { command: cmd },
    });
    return data ? data.code : null;
  }
  ß;
  static async info() {
    const data = await this.getData("c", {
      endpoint: "info",
      method: "GET",
    });
    return data ? data : null;
  }

  static async onlineStaff() {
    const data = await this.getData("c", {
      amount: 2,
      1: { endpoint: "players", method: "GET" },
      2: { endpoint: "vehicles", method: "GET" },
    });
    const vehicles = data[1];
    const players = data[0];
    if (!players) return [];

    return Object.values(players)
      .filter((user) => user.Permission !== "Normal")
      .map((user) => {
        const [username, id] = user.Player.split(":");
        const vehicle = vehicles.find((vehicle) => vehicle.Owner === username);
        return {
          roblox: {
            username,
            id,
            permission: user.Permission,
            team: user.Team,
            vehicle,
          },
        };
      });
  }

  static async getUsersByTeam(team) {
    const validTeams = ["DOT", "Sheriff", "Police", "Civilian", "Fire"];
    if (!validTeams.includes(team)) return [];

    const players = await this.getData("c", {
      endpoint: "players",
      method: "GET",
    });
    if (!players) return [];

    if (team.startsWith("!")) {
      return Object.values(players)
        .filter((user) => user.Team !== team)
        .map((user) => {
          const [username, id] = user.Player.split(":");
          return { username, id };
        });
    }

    return Object.values(players)
      .filter((user) => user.Team === team)
      .map((user) => {
        const [username, id] = user.Player.split(":");
        return { username, id };
      });
  }

  static async getUsersByPerm(perm) {
    const players = await this.getData("c", {
      endpoint: "players",
      method: "GET",
    });
    if (!players) return [];

    if (perm.startsWith("!")) {
      return Object.values(players)
        .filter((user) => user.Permission !== perm)
        .map((user) => {
          const [username, id] = user.Player.split(":");
          return { username, id };
        });
    }

    return Object.values(players)
      .filter((user) => user.Permission === perm)
      .map((user) => {
        const [username, id] = user.Player.split(":");
        return { username, id };
      });
  }

  static async getMemberCount() {
    try {
      const data = await this.getData("c", {
        endpoint: "players",
        method: "GET",
      });
      const memberCount = Object.keys(data).length || 0;
      return memberCount;
    } catch (error) {
      return "?";
    }
  }

  static async vehicles() {
    const data = await this.getData("c", {
      endpoint: "vehicles",
      method: "GET",
    });
    const vehicles = data;
    if (!vehicles) return [];

    return vehicles;
  }

  static async players() {
    const data = await this.getData("c", {
      endpoint: "players",
      method: "GET",
    });
    const players = data;
    if (!players) return [];

    return players;
  }

  static async joinlogs() {
    const data = await this.getData("c", {
      endpoint: "joinlogs",
      method: "GET",
    });
    const joinlogs = data;
    if (!joinlogs) return [];

    return joinlogs;
  }

  static async killlogs() {
    const data = await this.getData("c", {
      endpoint: "killlogs",
      method: "GET",
    });
    const killlogs = data;
    if (!killlogs) return [];

    return killlogs;
  }

  static async commandlogs() {
    const data = await this.getData("c", {
      endpoint: "commandlogs",
      method: "GET",
    });
    const commandlogs = data;
    if (!commandlogs) return [];

    return commandlogs;
  }

  static async queue() {
    const data = await this.getData("c", {
      endpoint: "queue",
      method: "GET",
    });
    const queue = data;
    if (!queue) return [];

    return queue;
  }

  static async bans() {
    const data = await this.getData("c", {
      endpoint: "bans",
      method: "GET",
    });
    const bans = data;
    if (!bans) return [];

    return bans;
  }

  static async modcalls() {
    const data = await this.getData("c", {
      endpoint: "modcalls",
      method: "GET",
    });
    const modcalls = data;
    if (!modcalls) return [];

    return modcalls;
  }
}

module.exports = Prc;
