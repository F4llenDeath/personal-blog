---
title: '基于Fabric, Velocity和MCDR搭建Minecraft服务器'
description: 'Minecraft服务器设置指南，基于我在建立一个小型的技术生存服务器时的经验'
date: 2025-05-15
tags: ['Minecraft', 'selfhost']
image: './BMSFVM.png'
authors: ['F4llenDeath']
lang: 'zh'
---

## 引言

每个玩mc的孩子都有自己的服主梦。

这篇文章将基于我自己搭建基友生电服的经验，为新手提供一篇最大程度上防止踩坑的教程。但是只适用于想要和三五好友联机的需求，不涉及专业的网络环境设置，运维等。

### 硬件

首先叠甲，我是果粉，我对硬件的推荐大概率并不客观。

如果您在考虑为搭建mc服务器专门购买一台设备的话，我非常推荐丐版m系芯片Mac mini（连脏小豆都在[推荐](https://b23.tv/TrWLKFW)哦）。我目前运行着3个体量不大的子服，8G内存可以流畅运行但是已经开始捉襟见肘，我认为16G是比较合适的内存容量。

我认为Mac mini的优点主要有：

1. 对于放在家里而大概率放在书桌上的设备，Mac mini 有其他设备无法比拟的超低功耗和噪音
2. 即使是初代m1芯片的单核性能也足以撑起中等体量的生电服（众所周知mc只吃单核）
3. 简单来说，比它性能更强的设备没他安静，比它安静的设备性能没它强
4. 在服务器设置上，macOS其实比windows更方便

但是同时也有缺点：

1. 苹果祖传金子内存
2. macOS作为服务端系统稳定性并没有经过大量的使用验证，即使我的服务器目前没有因为物理机出现过问题。如果对macOS没有信心，可以考虑安装[Fedora Asahi Remix](https://asahilinux.org/fedora/)(本人并没有使用，不保证可靠）
3. 网上有部分人提到arm对生电以外的模组整合包兼容性不佳，以及可能有潜在的大小核调度问题。虽然我都没有遇到，但是依然在这里列出。（光影与服务端无关）

### 我的环境
1. 物理机：Mac mini (M1, 8G内存)
2. 操作系统：macOS 15 Sequoia
3. 终端：Mac terminal + Zsh
4. 安装的游戏版本：1.21.4

虽然这篇文章都是使用macOS进行搭建，但是相同的操作完全可以在windows和linux上进行。同时，教程永远无法覆盖在搭建服务器过程中所有可能出现的问题，强烈建议在使用本教程的同时多寻求llm (ChatGPT, Gemini, grok etc.) 的帮助，他们能够很好的处理各种很难在网络上找到先例的疑难杂症。本教程的链接中文和英文混杂，如果您在阅读时遇到困难，请使用各大浏览器内置的翻译功能。

------



## Fabric

### Fabric是干嘛的

Fabric是一个模组加载器，在服务器上安装能够允许我们运行服务端模组，比如对生电服必不可少的地毯(carpet)全家桶，masa全家桶的服务端支持等。

### 安装 java

Java是Minecraft Java版必不可少的环境， 而且从1.20.5开始，Java版本必须为21或更高。在Mac上安装JDK (Java Developer Kit)，我建议使用homebrew，因为这样只需要在终端(terminal)里运行两行代码：
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install openjdk
```
如果您想要手动安装，可以参考farbic官方提供的[教程](https://wiki.fabricmc.net/player:tutorials:java:mac)，[Windows](https://docs.fabricmc.net/players/installing-java/windows)和[Linux](https://docs.fabricmc.net/players/installing-java/linux)也分别可以参考。

在安装结束后，可以用`java -version`验证安装，如果您看到`openjdk version "21.x.x"`或者更高的版本，则安装成功。如果没有看到这条消息，说明homebrew并未自动设置环境变量。可以在终端里运行以下代码：

```bash
export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"
export CPPFLAGS="-I/opt/homebrew/opt/openjdk@21/include"
source ~/.zshrc
```
此时再次运行`java -version`，就能看到已安装的的java的版本信息了。

### 安装 Fabric 服务端

我们可以从[这里](https://fabricmc.net/use/server/)下载所需版本的 Fabric 服务端启动器。我们将会得到`fabric-server-mc.1.21.4-loader.0.16.14-launcher.1.0.3.jar`文件（以1.21.4为例）。在您想要安装服务器文件的文件夹内，在终端里运行这个`.jar`文件：

```bash
cd folder-you-prefer
java -jar fabric-server-mc.1.21.4-loader.0.16.14-launcher.1.0.3.jar
```

此时会自动下载服务端文件和依赖库，但是我们会收到这样一条报错消息：

```
[main/WARN]: Failed to load eula.txt
[main/INFO]: You need to agree to the EULA in order to run the server. Go to eula.txt for more info.
```

这是正常的，此时文件夹内应该有这些文件：

```
 ./
├── libraries/
├── logs/
├── versions/
├── mods/
├── eula.txt
└── server.properties
```

现在可以将您准备的服务端mod放入mods文件夹中（至少需要[fabric api](https://modrinth.com/mod/fabric-api))，修改`server.properties`为服务器设置合适的配置（可参考[wiki](https://minecraft.fandom.com/wiki/Server.properties)）,修改`eula.txt`中的`false`为`true`表示同意许可协议。

此时可以再次运行上述的`.jar`文件启动服务器。当我们看到`[Server thread/INFO]: Done!`时，说明服务器已经开始运行。如果不需要群组服和插件功能，到这一步就已经可以愉快的进服玩耍了。如果需要更多网络设置帮助，可以跳至本文的网络设置部分。额外内容部分也包含一些我的服务器设置以供参考。

------



## Velocity

### Velocity又是什么

你可能注意到，生电服务器一般都有多个子服，比如大多数都会有“生存服”，“镜像服”和“创造服”，而玩家们可以在游戏内通过`/server`命令进行自由切换。这就是群组服，而velocity作为代理服务器可以达到这个目标。

[Aimerny](https://aimerny.github.io/2023/09/26/mcdr/mcdr-tutor-3-velocity/) 大佬对velocity的工作原理有着非常形象的解释：

> Velocity是一个群组服代理。他本身并不会有任何的服务端逻辑。它会负责将连接到velocity的MC客户端按照配置好的规则分发到对应的服务端。
>
> 比喻一下，整个群组服好比一个酒店，而velocity可以理解为酒店的前台。所有要进入酒店房间的顾客都要先经过前台指引才能到达对应的房间。当顾客想换房间的时候，也可以经过前台去更换房间。前台本身并不是一个房间，但是前台应当知道顾客可以访问的其他房间。
>
> 将概念换回来，我们可以得出以下结论：
>
> 1. velocity并不是服务端，它只处理客户端→服务端的连接
> 2. velocity是整个群组服的入口，所有子服应当配在velocity中。客户端无需关注子服的具体地址。

如果您想了解更多，[这里](https://papermc.io/software/velocity)是velocity的官网。

### 安装velocity

首先我们下载[FabricProxy-Lite Mod](https://modrinth.com/mod/fabricproxy-lite/versions)， 并将其放进mods文件夹中。此时我们运行一次服务器以生成配置文件。关闭服务器后，在服务器文件夹内创建`velocity`文件夹，[下载](https://papermc.io/downloads/velocity)最新版本的`velocity.jar`并将其放入。此时我们在终端内运行

```bash
cd velocity
java -jar velocity-3.4.0-SNAPSHOT-469.jar
```

启动velocity。当看到`[INFO]: Done!`时说明velocity第一次启动成功，同时velocity文件夹内出现了`velocity.toml`配置文件。以标准的“生存-镜像-创造”为结构的生电群组服为例，我们需要对这个配置文件进行以下修改：

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

保存修改后我们回到上一级文件夹，即服务器文件夹。在第一次运行velocity时这里自动生成了`config`文件夹，里边有有一个配置文件`FabricProxy-Lite.toml`。此时我们打开这一配置文件，并找到`secret = ""`这一条。此时我们回到`velocity`文件夹，可以在其中找到`forwarding.secret`，打开后可以看到一串密钥。将这串密钥填入到`secret = "your-secret-key"`，保存修改。

### 运行群组服

群组服需要有多个服务器实例，此时我们可以将当前的服务器文件夹作为main服务器，将其复制两份分别作为mirror和creative服务器。在这两个服务器中，我们将`server.properties`中的`server-port`对应的修改为25566和25567。此时我们分别在三个服务器文件夹内通过`java -jar fabric-server-mc.1.21.4-loader.0.16.14-launcher.1.0.3.jar`启动服务器，群组服就已经开始运行了。此时在游戏内我们就可以通过`/server <name>` 指令在子服间切换。

------



## MCDR

### 怎么又来一个MCDR

生电不喜欢paper，spigot等服务端，主要是因为他们不够原版，机器搓完了发现因为服务端魔改了特性导致跑不起来实在是非常让人恼火。但是Mojang的原版服务端本身又无法安装插件，这就是为什么我们热爱MCDaemonReforged — 我们可以在不对原版服务端进行任何修改的前提下运行插件。

想要了解更多，可以查看MCDR的[官网](https://mcdreforged.com/)

### 安装 python

目前的MCDR 2.14 版本需要 python 3.8 及以上。对于macOS，我们也可以通过homebrew简单且快速地安装：

```bash
brew install python
python3 --version
```

此时会看到`Python 3.x.x`，且新于3.8，说明安装成功。

### 安装 MCDR

MCDR有着非常详细可靠的[简中文档](https://docs.mcdreforged.com/zh-cn/latest/)，本文的这一部分基本上在复述其内容。

对于macOS，文档建议将MCDR安装在隔离环境中，原因主要是：

> 如果你使用的是 Windows，上述命令应当能正常工作，MCDR 将被安装到全局环境中，你可以忽略本节内容
>
> 但是，在 Linux 和 Mac OS 中，我们不建议全局（使用 root）安装 MCDR，因为它可能会与其他 Python 包产生冲突，并可能影响系统依赖
>
> 全局安装也使得版本管理变得困难，并且需要管理员权限，增加了安全风险
>
> 全局安装甚至可能导致 `externally-managed-environment` 错误，详见 [PEP 668](https://peps.python.org/pep-0668/)
>
> 为了安全起见，最好将 MCDR 安装在一个与全局环境相隔离的环境中。有如下几种方案可供参考：
>
> | 方式   | 优点               | 缺点                                  |
> | ------ | ------------------ | ------------------------------------- |
> | pip    | 原生支持，总是可用 | 非隔离环境，root 使用时可能影响全局包 |
> | pipx   | 易于使用           | 第三方工具，命令不同                  |
> | venv   | 原生支持           | 需要手动激活环境                      |
> | docker | 多环境下一致可靠   | 更多依赖和磁盘空间，学习路线曲折      |
> | 系统包 | -                  | 与 pip 相同，**不推荐使用**           |

我选择使用了pipx，同样通过homebrew安装：

```bash
brew install pipx
pipx ensurepath
```

这时安装MCDR：

```bash
pipx install mcdreforged
```

### 启动

如果已经设置好了velocity群组服，我们会有多个独立的服务端，MCDR需要在每一个服务端上分别启动。现在我们的服务端里应该有这样的文件结构
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

这一步我推荐在服务器文件夹外创建另外一个文件夹，并在新文件夹内初始化MCDR：

```bash
cd my_mcdr_server
mcdreforged init
```

MCDR会生成默认的文件结构：

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

此时需要将开始提到的服务端文件夹内的所有文件整体放入这里的`server`文件夹中，得到：

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

根据您的需求和硬件，我推荐参考[配置文档](https://docs.mcdreforged.com/zh-cn/latest/configuration.html)个性化修改配置文件。对于启动MCDR的最低限度，需要做出以下修改：

对于`config.yml`：

```yaml
language: zh_cn
working_directory: server
start_command: java -Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8 -Dstderr.encoding=UTF-8 -Xmx8G -jar fabric-server-mc.1.21.4-loader.0.16.10-launcher.1.0.1.jar nogui
handler: vanilla_handler
```

对于`permission.yml`（这里的权限只影响使用MCDR插件时的权限等级，游戏内权限需要修改`./server/ops.json`）：

```yaml
default_level: user
owner:
- your-MC-account-name
```

现在已经完成的MCDR的安装和配置，现在需要关闭服务器，并在每一个服务器的MCDR文件夹内运行`mcdreforged`即可在MCDR下启动服务器。此时在服务器内和终端里都可以使用`!!MCDR`命令查看相关信息。

恭喜！到这里您就有了属于您自己的功能完整的生电MC服务器了，享受您的劳动成果吧！如果需要内网穿透和更多的高级设置，请继续往下看。

## 网络设置

> 如果您有固定公网ip，请忽略这一部分。

对于目前的家庭宽带，除非额外向运营商支付固定公网ip地址的费用，得到的大概率是动态或内网ip。这样的ip地址无法直接用来运行MC服务器。如果您不知道自己是否拥有静态公网ip，可以使用以下方法确认（来自GPT-4o)：

> 1. 查找当前公网 IP
>    你可以通过以下方式查看你当前的公网 IP 地址：
>    1. 打开浏览器访问：[https://whatismyipaddress.com](https://whatismyipaddress.com)
>    2. 或者在终端中输入命令：
>
>       ```bash
>       curl ifconfig.me
>       ```
>
> 2. 重启路由器后再次检查
>    1. 重启你的路由器或光猫（建议等几分钟后重新拨号）
>    2. 然后再次使用上面的方法检查公网 IP 是否有变化
>       判断标准
>       1. 如果 **IP 地址发生了变化** → 说明你使用的是 **动态 IP**
>       2. 如果 **IP 地址没有变化** → 你**可能**拥有静态 IP（还需进一步确认）
>          > 注意：有些动态 IP 的租期很长，看起来像静态 IP，但仍可能会变。
>
> 3. 登录路由器后台查看设置
>    大多数家用宽带默认使用动态 IP。你可以通过以下方式确认：
>    1. 打开浏览器输入：`192.168.1.1` 或 `192.168.0.1`（取决于你的路由器）
>    2. 登录后台后，查看“网络设置”或 “WAN 设置”页签
>    3. 查找字段：
>       1. 若写着 **"DHCP"、"动态 IP"、"PPPoE"**，就是动态的
>       2. 若显示 **"静态 IP"**，就是固定的公网地址
>
> 4. 联系你的网络服务提供商（最可靠）
>    1. 问客服：“我当前使用的是公网静态 IP 吗？”
>    2. 有些运营商提供**付费静态 IP 服务**，如果你需要长期公网可访问的服务器，可以考虑升级套餐。

### 内网穿透

我没有计算机专业背景，我解释术语实在是误人子弟。想了解更多可以参考一些介绍：[Cloudflare](https://www.cloudflare.com/learning/network-layer/what-is-tunneling/), [wikipedia](https://zh.wikipedia.org/zh-cn/NAT穿透)。 通过内网穿透，我们可以将没有公网ip的本地服务器暴露到互联网，也就能实现在没有静态ip的情况下运营MC服务器。

常见的内网穿透工具主要有：

| 名称                                                         | 优点                                                         | 缺点                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| [**FRP**](https://github.com/fatedier/frp)                   | - 免费开源，可自托管<br>- 支持 TCP/UDP<br>- 高性能<br>- 可自定义端口与域名 | - 配置略复杂<br>- 需要公网 VPS 支持<br>- 安全性需自行控制    |
| [**Ngrok（免费版）**](https://ngrok.com)                     | - 使用简单<br>- 适合快速测试<br>- 支持 HTTP 隧道<br>- 有 Web UI | - 不支持 TCP<br>- 每次启动端口变化<br>- 免费版流量有限       |
| [**Ngrok（付费版）**](https://ngrok.com)                     | - 固定子域名和端口<br>- 更高带宽<br>- 稳定性好               | - 收费较贵<br>- 私有服务限制较多                             |
| [**Cloudflare Tunnel**](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) | - 完全免费<br>- 安全性高（自带防火墙+SSL）<br>- 支持自定义域名 | - 只支持 HTTP/HTTPS<br>- 无法直接穿透 Minecraft/SFTP 等非 Web 服务 |
| [**Tailscale Funnel**](https://tailscale.com/kb/1223/funnel) | - 简单好用<br>- 基于 WireGuard 安全可靠<br>- 点对点通信支持私网访问 | - 中国大陆不稳定<br>- Funnel 功能仍在测试阶段或不支持所有平台 |

我选择在服务器上部署了frp，以下是部署教程。您也可以参考[官方文档](https://github.com/fatedier/frp)。

> ⚠️注意：我不居住在中国大陆，本文中所提到的我的所有服务都合法部署于非中国大陆服务器。我并不清楚在中国大陆进行以下的操作是否会违反法律法规。我只在纯技术上进行讨论，您应当自行了解并遵守当地法律法规。按照本教程操作造成的一切法律风险和后果由您自负。

首先您需要购买一台VPS。我无法提供针对品牌的购买建议，您可以参考一些包含大量真实用户反馈的subreddit：[r/selfhosted](https://www.reddit.com/r/selfhosted/)，[r/vps](https://www.reddit.com/r/VPS/)，[r/homelab](https://www.reddit.com/r/homelab/)等。frp只需要主流服务商的最低配置即可流畅运行（1 核 / 1GB 内存），但是需要能够分配一个IPv4地址。

购买后便可在 VPS 上安装并配置 frps（服务端）。首先`ssh root@your-vps-ip-address`连接到你的VPS。

下载frp（基于您的VPS硬件和系统选择对应版本）：

```bash
 wget https://github.com/fatedier/frp/releases/download/v0.62.1/frp_0.62.1_linux_amd64.tar.gz
 tar -zxvf frp_0.62.1_linux_amd64.tar.gz
 cd frp_0.62.1_linux_amd64
```

现在应该能在文件夹中看到这样的结构：

```
./
├── frpc
├── frpc.toml
├── frps
├── frps.log
├── frps.toml
└── LICENSE
```

此时通过`nano frps.toml`修改这个配置文件。对于已经使用velocity将端口设置为25577的服务器来说，在VPS上的配置应为：

```toml
[common]
bind_port = 7000
token = "your-secret-token"

[minecraft]
type = tcp
local_port = 25577
remote_port = 25565
```

此时可以通过`ctrl+x`，`y`，`enter`保存修改。

通过同样的流程您需要在运行MC服务器的本地设备上也安装frp。现在我们需要配置的是frpc（客户端），即`nano frpc.toml`，进行以下配置：

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

这里`frps.toml`和`frpc.toml`里的token是由您自己设定的字符串，需要保证两侧完全相同，用于frp的身份验证。在保存后，现在可以用`nohup`分别使frps和frpc保持在后台运行，即在VPS上运行`nohup ./frps -c ./frps.toml > frps.log 2>&1 &`，在您的本地设备上运行`nohup ./frpc -c ./frpc.toml > frps.log 2>&1 &`。

现在您的MC服务器已经可以直接通过`your-vps-ip-address:25565`访问，即在MC客户端中输入VPS的ip地址即可进入服务器。

------



## 高级

### 安全

暴露在公网的Minecraft服务器一直是被攻击的重灾区，[r/admincraft](https://www.reddit.com/r/admincraft/)上能见到各种因为没有合理的安全防护而被攻击者连接并破坏的服务器案例。**白名单**必须设置，否则被陌生人进入服务器并大肆破坏只是时间问题。当我还不是服主时我和朋友的上一个基友服就因此受到了严重破坏（血泪教训）。

MC原版服务端自带白名单功能。开启白名单需要在`server.properties`中修改`white-list=true`。之后打开`whitelist.json`添加白名单账号。MC正版账号的uuid可以在[这里](https://mcuuid.net)搜索。以下是白名单格式：

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

白名单只对所在的服务器实例生效。如果您搭建了群组服，则需要对每一个服务器单独配置白名单。配置完成后重启服务器，即可使白名单生效，此时只有符合uuid的正版账号可以进入服务器。

另外，推荐将自己的账号设置为op。MC服务器的后台永远有着最高的权限，但是op可以在游戏内控制台使用需要权限的命令。相似的，op在`ops.json`中设置：

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

如果需要更高程度的安全防护，可以设置[fail2ban](https://fail2ban.readthedocs.io/en/latest/index.html)进一步防止暴力破解。

### 域名

虽然对于只有几人游玩的私密服务器来说必要性不高，但是我们可以为MC服务器绑定域名。在此之前您需要购买一个域名并能够修改它的DNS记录。

这样就可以设置一个A类型的DNS记录，指向你的服务器ip地址，即

| **Type** | **Name** | **Value**    |
| -------- | -------- | ------------ |
| A        | mc       | Your-ip-addr |

现在就可以通过`mc.yourdomain.com`加入你的服务器。

同时，如果您设置了velocity，它支持对群组服中的每一个子服单独设置域名。需要在`velocity.toml`中进行如下设置：

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



## 额外内容

### 模组

我在这里列出我的服务器所安装的模组列表（1.21.4），属于比较标准的生电服配置，供参考。

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

### 插件

这些是我使用的MCDR插件。更多的可以在MCDR[插件仓库](https://mcdreforged.com/en/plugins)里找到。

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

这是我使用的velocity插件。更多插件同样可以在velocity[插件仓库](https://hangar.papermc.io/?platform=VELOCITY&sort=-stars)中找到。

```
ChatHub-1.9.0.jar
```

------



## 参考

- [Aimerny pre](https://aimerny.github.io/2023/09/25/mcdr/mcdr-tutor-1-pre/)
- [Aimerny fabric](https://aimerny.github.io/2023/09/26/mcdr/mcdr-tutor-2-fabric/)
- [Aimerny velocity](https://aimerny.github.io/2023/09/26/mcdr/mcdr-tutor-3-velocity/)
- [Aimerny MCDR](https://aimerny.github.io/2023/09/26/mcdr/mcdr-tutor-4-mcdr/)
- [aytony MCDR](https://blog.aytony.top/0a680a8ca395/)
- [aytony framework](https://blog.aytony.top/f61647068e70/)
