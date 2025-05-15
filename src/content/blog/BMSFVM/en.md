---
title: 'Building a Minecraft Server with Fabric, Velocity, and MCDR'
description: 'A Minecraft server setup guide based on the lessons I learned while setting up a small, friend‑only technical-survival server'
date: 2025-05-15
tags: ['Minecraft', 'selfhost']
image: './BMSFVM.png'
authors: ['F4llenDeath']
lang: 'en'
---

## Introduction

Every Minecraft player has dreamed of running their own server at least once.

This article distills the lessons I learned while setting up a small, friend‑only technical-survival server. It’s aimed at hobbyists who want to play with three to five friends, and it doesn’t touch professional networking or DevOps.

### Hardware

First, a disclaimer: I’m an Apple devotee, so my hardware advice is inevitably biased.

If you’re shopping for a dedicated machine, I heartily recommend the entry‑level M‑series Mac mini. I run three lightweight sub‑servers on the 8 GB model; it works, but 16 GB feels comfortable.

I think the Mac mini has four key advantages:

1. Whisper‑quiet operation and ultra‑low power draw—perfect for something that lives on your desk.
2. Even the first‑gen M1’s single‑core performance can power a mid‑sized technical server (Minecraft is heavily single‑threaded).
3. Anything faster is louder; anything quieter is slower.
4. macOS is actually easier to manage than Windows for server tasks.

But there are downsides, too:

1. Apple’s notoriously pricey RAM.
2. macOS hasn’t seen as much headless‑server testing. Mine’s stable, but if you prefer Linux you can install [Fedora Asahi Remix](https://asahilinux.org/fedora/) (untested by me).
3. Some users report ARM compatibility issues with heavy modpacks or potential P-E core scheduling quirks (I haven’t encountered them; shaders are client‑side anyway).

### My environment

1. Physical machine: Mac mini (M1, 8G RAM)
2. Operating system: macOS 15 Sequoia
3. Terminal: Mac terminal + Zsh
4. installed game version: 1.21.4

Although this article is all about building with macOS, the same operations can be performed on windows and linux. At the same time, a tutorial can never cover all the possible problems that may arise during the process of setting up a server, it is highly recommended to use this tutorial along with the help of llm (ChatGPT, Gemini, grok etc.), which are able to deal with all kinds of problems that are difficult to find precedents for on the web. The links in this tutorial are in a mix of Chinese and English, so if you have trouble reading them, please use the built-in translation function of your browser.

------



## Fabric

### What Is Fabric?

Fabric is a lightweight mod loader that lets us run server‑side mods such as the Carpet suite or masa’s utilities—essentials for technical play.

### Install Java

Minecraft Java Edition obviously needs Java, and since 1.20.5 the minimum version is 21. On macOS I install the JDK via Homebrew because it’s just two terminal commands.
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install openjdk
```
If you’d rather install manually, check Fabric’s [Windows guide](https://docs.fabricmc.net/players/installing-java/windows) and [Linux guide](https://docs.fabricmc.net/players/installing-java/linux).

When the install completes, run `java -version`. Seeing `openjdk version "21.x.x"` (or higher) means success. If you don’t, add Java to your PATH with the snippet below.

```bash
export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"
export CPPFLAGS="-I/opt/homebrew/opt/openjdk@21/include"
source ~/.zshrc
```
Run `java -version` again and you should now see the version string.

### Set Up the Fabric Server

Download Fabric from [here](https://fabricmc.net/use/server/)—this guide uses `fabric-server-mc.1.21.4-loader.0.16.14-launcher.1.0.3.jar` as an example—and execute the `.jar` inside your chosen server folder:

```bash
cd folder-you-prefer
java -jar fabric-server-mc.1.21.4-loader.0.16.14-launcher.1.0.3.jar
```

The launcher will fetch the server jar and libraries, then throw an error like this:

```
[main/WARN]: Failed to load eula.txt
[main/INFO]: You need to agree to the EULA in order to run the server. Go to eula.txt for more info.
```

That’s expected. Your folder should now contain these files:

```
 ./
├── libraries/
├── logs/
├── versions/
├── mods/
├── eula.txt
└── server.properties
```

Drop your server‑side mods into `mods/` (at minimum install [Fabric API](https://modrinth.com/mod/fabric-api)) and change `false` to `true` in `eula.txt` to accept the EULA.

Run the jar again. When `[Server thread/INFO]: Done!` appears, the server is ready. For networking help see the networking section; the Extras section shows my own config for reference.

------



## Velocity

### What Is Velocity?

Technical servers often run multiple backends—`Survival`, `Mirror`, `Creative`—and let players switch with `/server`. Velocity is the proxy that makes this possible.

Blogger [Aimerny](https://aimerny.github.io/2023/09/26/mcdr/mcdr-tutor-3-velocity/) offers a vivid analogy:

> Velocity is a proxy for a Minecraft network. It contains no server logic; it simply routes incoming clients to the correct backend according to your rules.
>
> Think of the network as a hotel and Velocity as the concierge desk. Guests check in, get directions to their rooms, and can move to another room by returning to the desk. The desk isn’t a room itself, but it knows which ones exist and who’s allowed in.
>
> Bringing the analogy back to Minecraft, we can draw two conclusions:
>
> 1. Velocity is not a game server; it only handles client ↔ server connections.
> 2. Velocity is the sole entry point, so every backend must be registered there. Players never see individual addresses.

For more details, visit the [official Velocity site](https://papermc.io/software/velocity).

### Installing Velocity

First we download the [FabricProxy-Lite Mod](https://modrinth.com/mod/fabricproxy-lite/versions) and put it in the mods folder. At this point we run the server once to generate the configuration file. After shutting down the server, create a `velocity` folder inside the server folder, [download](https://papermc.io/downloads/velocity) the latest version of `velocity.jar` and put it in. Now run in the terminal:

```bash
cd velocity
java -jar velocity-3.4.0-SNAPSHOT-469.jar
```

to start Velocity. When `[INFO]: Done!` appears, the proxy has booted and created `velocity.toml`. For a Survival–Mirror–Creative setup, edit these fields:

```toml
bind = "0.0.0.0:25577"
online-mode = true
player-info-forwarding-mode = "modern"

[servers]
main = "127.0.0.1:25565"
mirror = "127.0.0.1:25566"
creative = "127.0.0.1:25567"

try = [
    "main",
    "mirror"
]
```

After saving the changes we go back to the previous folder, the server folder. The `config` folder was automatically created here the first time velocity was run, and inside there is a configuration file `FabricProxy-Lite.toml`. At this point we open this configuration file and find the entry `secret = “”`. At this point we go back to the `velocity` folder where we can find `forwarding.secret` and open it up to see a string of keys. Fill this key into `secret = “your-secret-key”` and save the changes.

### Running the Network

The cluster service requires multiple server instances, at this point we can use the current server folder as the main server and make two copies of it as the mirror and creative servers respectively. In these two servers, we change the `server-port` in `server.properties` to 25566 and 25567 respectively, and at this point, we pass `java -jar fabric-server-mc.1.21.4-loader.0.16.14-launcher.1.0.3.jar` in each of the three server folders to start the servers, and the cluster service is up and running. Now we can switch between subservices in-game with the `/server <name>` command.

------



## MCDR

### What is MCDR?

Vanilla servers can’t run plugins, and Paper/Spigot alter core mechanics. Minecraft Daemon Reforged (MCDR) lets us run plugins *without* touching the vanilla server core.

See the [official MCDR website](https://mcdreforged.com/) for more info.

### Install Python

MCDR 2.14 requires Python 3.8+. On macOS you can install it quickly with Homebrew:

```bash
brew install python
python3 --version
```

You should see `Python 3.x.x` (≥ 3.8) when you run `python3 --version`.

### Install MCDR

MCDR’s [docs](https://docs.mcdreforged.com/en/latest/) are excellent; this section paraphrases them.

On macOS the docs recommend an isolated install because:

> If you’re using Windows, the command above should work fine, and MCDR will be installed to the global environment - you may ignore this section
>
> For Linux and Mac OS, it’s not recommended to install MCDR system-wide (with root), because it can cause conflicts with other Python packages and affect system dependencies
>
> System-wide installation also makes version management difficult and requires administrator privileges, increasing security risks
>
> System-wide installation may even result in an `externally-managed-environment` error. See [PEP 668](https://peps.python.org/pep-0668/) for the detailed specification
>
> It’s safer to keep the installation isolated. As workarounds, there’re multiple options for you. In conclusion:
>
> | Method         | Pros                         | Cons                                                         |
> | -------------- | ---------------------------- | ------------------------------------------------------------ |
> | pip            | Native, always available     | Not isolated, may affect global packages with root privileges |
> | pipx           | Simplest                     | 3rd party, different command set                             |
> | venv           | Native support               | Requires manual environment activation                       |
> | docker         | Reliable across environments | More dependencies and disk space, convoluted learning path   |
> | system package | -                            | Same as pip, **not recommended**                             |

I chose **pipx**, which you can also install via Homebrew:

```bash
brew install pipx
pipx ensurepath
```

Then install MCDR itself:

```bash
pipx install mcdreforged
```

### Launching

If you’ve set up Velocity, you now have multiple server instances. Start MCDR inside each one; your folder should look like this:
 ```
./
├── config/
├── libraries/
├── logs/
├── mods/
├── velocity/
├── versions/
├── world/
├── banned-ips.json
├── banned-players.json
├── eula.txt
├── fabric-server-mc-launcher.jar
├── ops.json
├── server.properties
├── usercache.json
└── whitelist.json
 ```

I suggest creating a sibling directory outside the server folder and initializing MCDR there:

```bash
cd my_mcdr_server
mcdreforged init
```

MCDR creates the default structure:

```
my_mcdr_server/
 ├─ config/
 ├─ logs/
 │   └─ MCDR.log
 ├─ plugins/
 ├─ server/
 ├─ config.yml
 └─ permission.yml
```

Copy *all* files from your original server into the new `server` sub‑folder so it looks like:

```
    my_mcdr_server/
    ├─ config/
    ├─ logs/
    │   └─ MCDR.log
    ├─ plugins/
    ├─ server/
++  │   ├─ ...
++  │   ├─ minecraft_server.jar
++  │   └─ server.properties
    ├─ config.yml
    └─ permission.yml
```

Tailor the configs to your needs—see the [config guide](https://docs.mcdreforged.com/zh-cn/latest/configuration.html). At minimum, change:

For `config.yml`:

```yaml
language: zh_cn
working_directory: server
start_command: java -Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8 -Dstderr.encoding=UTF-8 -Xmx8G -jar fabric-server-mc.1.21.4-loader.0.16.10-launcher.1.0.1.jar nogui
handler: vanilla_handler
```

For `permission.yml` (plugin permissions; gameplay permissions remain in `./server/ops.json`):

```yaml
default_level: user
owner:
- your-MC-account-name
```

MCDR is now installed. Stop the server, cd into each MCDR folder, and run `mcdreforged` to launch. In‑game and console now accept the `!!MCDR` command.

Congrats—your technical Minecraft server is live! Enjoy your handiwork, and read on for port‑forwarding and other advanced tweaks.

## Networking

> **Skip this section if you already have a static public IP.**

Most home ISPs provide dynamic or private addresses unless you pay for a static IP. Such addresses can’t host a public server directly. If you’re unsure whether yours is static, try this (credit: GPT‑4o):

> 1. **Find your current public IP.**
>    You can:
>    1. Visit [https://whatismyipaddress.com](https://whatismyipaddress.com).
>    2. Or run a command in the terminal:
>
>       ```bash
>       curl ifconfig.me
>       ```
>
> 2. **Reboot your router and check again.**
>    1. Power‑cycle your router or modem and wait a few minutes.
>    2. Check the public IP again.
>       **Interpretation:**
>       1. If the IP changed → you have a **dynamic IP**.
>       2. If the IP stayed the same → you **may** have a static IP (verify with ISP).
>       > Some dynamic IP leases are long and *look* static.
>
> 3. **Log into your router’s admin panel.**
>    Most routers default to dynamic IP. To confirm:
>    1. Visit `192.168.1.1` or `192.168.0.1`.
>    2. Navigate to *Network* or *WAN* settings.
>    3. Check the connection type:
>       1. **DHCP**, **Dynamic IP**, or **PPPoE** → dynamic.
>       2. **Static IP** → static public address.
>
> 4. **Call your ISP** (most reliable).
>    1. Ask support, “Do I have a static public IP?”
>    2. Many ISPs sell static IPs if you need one.

### NAT Traversal / Reverse Proxy

I’m no networking guru; for definitions see these intros: [Cloudflare](https://w...) or the Wikipedia article on NAT traversal. Reverse proxying lets you expose a local server to the internet without a static IP.

Popular tools include:

| **Name**                                                     | **Pros**                                                     | **Cons**                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| [**FRP**](https://github.com/fatedier/frp)                   | - Free & open‑source, self‑hostable<br />- Supports TCP/UDP<br />- High performance- Custom ports & domains | - Setup is a bit complex<br />- Requires a VPS with a public IP<br />- Security is DIY |
| [**Ngrok (Free)**](https://ngrok.com)                        | - Very easy to use- Great for quick testing<br />- Supports HTTP tunnels- Comes with a Web UI | - No TCP support<br />- Port changes every time you start it- Bandwidth is limited on the free tier |
| [**Ngrok (Paid)**](https://ngrok.com)                        | - Fixed sub‑domains and ports<br />- Higher bandwidth- Solid stability | - Relatively expensive<br />- Some private‑service limits    |
| [**Cloudflare Tunnel**](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) | - Completely free<br />- High security (built‑in firewall & SSL)<br />- Custom domain support | - HTTP/HTTPS only<br />- Can’t expose Minecraft, SFTP, or other non‑web services directly |
| [**Tailscale Funnel**](https://tailscale.com/kb/1223/funnel) | - Easy to use<br />- WireGuard‑based, very secure<br />- Peer‑to‑peer access inside a private network | - Unstable inside mainland China<br />- Funnel is still in preview / not on all platforms |

I use **frp**. Here’s a quick setup (see the [official docs](https://github.com/fatedier/frp) for details):

> ⚠️ **Legal note:** I host all services outside mainland China. I don’t know your local laws—this is purely technical info. Proceed at your own risk.

First, rent a VPS. Check real‑user reviews on subreddits like [r/VPS](https://www.reddit.com/r/VPS/) or [r/homelab](https://www.reddit.com/r/homelab/). A minimal plan (1 vCPU, 1 GB RAM) is plenty, but you *must* get an IPv4.

SSH into the VPS: `ssh root@your-vps-ip-address`.

Download frp (pick the build that matches your OS/arch):

```bash
 wget https://github.com/fatedier/frp/releases/download/v0.62.1/frp_0.62.1_linux_amd64.tar.gz
 tar -zxvf frp_0.62.1_linux_amd64.tar.gz
 cd frp_0.62.1_linux_amd64
```

You should now see a folder like this:

```
./
├── frpc
├── frpc.toml
├── frps
├── frps.log
├── frps.toml
└── LICENSE
```

Edit `frps.toml` with `nano`. If Velocity listens on 25577, the VPS config should be:

```toml
[common]
bind_port = 7000
token = "your-secret-token"

[minecraft]
type = tcp
local_port = 25577
remote_port = 25565
```

Save with `Ctrl+X`, `Y`, `Enter`.

Repeat on your home machine for `frpc.toml`:

``` toml
[common]
server_addr = your-vps-ip-address
server_port = 7000
token = "your-secret-token"

[minecraft]
type = tcp
local_ip = 127.0.0.1
local_port = 25577
remote_port = 25565
```

Make sure the `token` matches in both files. Start the services with `nohup ./frps -c ./frps.toml > frps.log 2>&1 &` on the VPS and `nohup ./frpc -c ./frpc.toml > frps.log 2>&1 &` locally.

Your server is now reachable via `your-vps-ip-address:25565`.

------



## Advanced

### Security

Public Minecraft servers are prime targets for griefers—[r/admincraft](https://www.reddit.com/r/admincraft) is full of horror stories. *Always* lock things down, or randoms will nuke your world. Trust me, it happened to my previous server.

Vanilla includes a whitelist. Set `white-list=true` in `server.properties` and add UUIDs to `whitelist.json`. Look up UUIDs at [mcuuid.net](https://mcuuid.net). Format:

```json
[  
	{
    "uuid": "player-1-uuid",
    "name": "player-1-name"
  },
  {
    "uuid": "player-2-uuid",
    "name": "player-2-name"
  },
]
```

The whitelist is per backend; configure each one and restart so only listed accounts can join.

Also make yourself an op. The console has full power, but ops let you run admin commands in‑game. Add yourself to `ops.json` like:

```json
[
  {
    "uuid": "op-uuid",
    "name": "op-name",
    "level": 4,
    "bypassesPlayerLimit": false
  }
]
```

For stronger protection, use [fail2ban](https://fail2ban.readthedocs.io/en/latest/index.html) to block brute‑force logins.

### Custom Domain

A domain isn’t mandatory for a friends‑only server, but it’s convenient. Buy a domain and make sure you can edit DNS.

Create an **A record** pointing to your server’s IP:

| **Type** | **Name** | **Value**    |
| -------- | -------- | ------------ |
| A        | mc       | Your-ip-addr |

You can now join via `mc.yourdomain.com`.

Velocity also lets you map sub‑domains to individual backends—configure them in `velocity.toml`:

```toml
[forced-hosts]
"main.yourdomain.com" = [
		"main"
]
"mirror.yourdomain.com" = [
		"mirror"
]
"creative.yourdomain.com" = [
		"creative"
]
```

------



## Extras

### Mods

Below is the list of mods installed on my server (version 1.21.4). It’s a fairly standard tech‑survival setup—feel free to use it as a reference.

```
Carpet-AMS-Addition-mc1.21.4-fabric-v2.55.0.jar
FabricProxy-Lite-2.9.0.jar
XaerosWorldMap_1.39.3_Fabric_1.21.4.jar
Xaeros_Minimap_25.0.1_Fabric_1.21.4.jar
carpet-extra-1.21.4-1.4.161.jar
carpet-tis-addition-v1.65.2-mc1.21.4.jar
fabric-api-0.115.1+1.21.4.jar
fabric-carpet-1.21.4-1.4.161+v241203.jar
gugle-carpet-addition-mc1.21.4-v2.10.0+build.5.jar
servux-fabric-1.21.4-0.5.1.jar
```

### Plugins

These are the MCDR plugins I’m using. You can find more in the MCDR [plugin repository](https://mcdreforged.com/en/plugins).

```
Beep-v1.1.0.mcdr
CrashRestart-v1.0.0.mcdr
Gamemode-v1.1.0.mcdr
Hat-v1.1.4.mcdr
Here-v1.2.2.mcdr
Info-v0.2.2.mcdr
MinecraftDataAPI-v1.6.1.mcdr
PermanentBackup-v1.0.3.mcdr
PrimeBackup-v1.8.3.pyz
```

Here’s the Velocity plugin I use. Additional plugins are available in the Velocity [plugin repository](https://hangar.papermc.io/?platform=VELOCITY&sort=-stars).

```
ChatHub-1.9.0.jar
```

------



## References

- [Aimerny pre](https://aimerny.github.io/2023/09/25/mcdr/mcdr-tutor-1-pre/)
- [Aimerny fabric](https://aimerny.github.io/2023/09/26/mcdr/mcdr-tutor-2-fabric/)
- [Aimerny velocity](https://aimerny.github.io/2023/09/26/mcdr/mcdr-tutor-3-velocity/)
- [Aimerny MCDR](https://aimerny.github.io/2023/09/26/mcdr/mcdr-tutor-4-mcdr/)
- [aytony MCDR](https://blog.aytony.top/0a680a8ca395/)
- [aytony framework](https://blog.aytony.top/f61647068e70/)