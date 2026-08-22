# CheeseRoll's Blog

基于 [smart-nav](https://github.com/LxCheeseRoll/smart-nav) 改造的个人博客，部署在 Cloudflare Pages，支持云端文章管理与 Markdown 写作。

---

## 功能特性

- 📝 **Markdown 文章管理** — 管理后台支持直接用 Markdown 写文章，实时预览
- ☁️ **Cloudflare KV 云端同步** — 文章、壁纸、密码全部存云端，多设备实时同步
- 🌙 **暗色 / 亮色主题** — 本地偏好自动记忆
- 🌍 **中英双语** — 一键切换语言
- 🌤️ **天气 + 时钟** — 自动定位城市，智能问候语
- 🔐 **管理员后台** — 双击底部版权文字登录，默认密码 `admin888`

---

## 部署教程（详细版）

### 第一步：上传代码到 GitHub

将以下文件 / 文件夹上传到你的 GitHub 仓库根目录：

```
index.html          ← 博客前端
functions/          ← Cloudflare Functions 后端
functions/api/
functions/api/config.js
functions/api/links.js
```

> ⚠️ `functions` 文件夹必须直接放在仓库根目录，不能嵌套在其他文件夹内。

---

### 第二步：创建 Cloudflare KV 数据库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧菜单 → **Workers & Pages** → **KV**
3. 点击 **创建命名空间**，名称填 `NAV_DATABASE`，确认创建

---

### 第三步：部署到 Cloudflare Pages

1. 左侧菜单 → **Workers & Pages** → **创建应用程序**
2. 选择 **Pages** 选项卡 → **连接到 Git**
3. 选择你的 GitHub 仓库 → **开始设置**
4. 构建设置（关键）：
   - 框架预设：**None**
   - 构建命令：**留空**
   - 构建输出目录：**留空**
   - 根目录：**留空**
5. 点击 **保存并部署**

---

### 第四步：绑定 KV 数据库（关键步骤！）

1. 部署完成后，点击 **继续处理项目** → **设置** → **函数**
2. 滚动到 **KV 命名空间绑定** → 点击 **添加绑定**
3. 变量名称填写（严格大小写）：`NAV_DB`
4. KV 命名空间选择你创建的 `NAV_DATABASE`
5. 点击 **保存**

---

### 第五步：重新部署

1. 进入 **部署** 选项卡
2. 找到最新部署记录，点击右侧 **重试部署**
3. 等待完成，即可访问

---

### 第六步：绑定自定义域名

1. 在 Cloudflare Pages 项目页面 → **自定义域名**
2. 输入你的域名 `cheeseroll.kdns.fr`
3. 按提示在域名服务商处添加 DNS 记录（CNAME 指向 `*.pages.dev`）
4. 等待 DNS 生效（通常几分钟）

> 💡 推荐将 SSL/TLS 模式设置为 **完全（严格）**，确保 HTTPS。

---

## 管理员后台使用

- **入口**：双击页面底部版权文字
- **默认密码**：`admin888`
- **登录后可**：
  - 用 Markdown 写 / 编辑 / 删除文章
  - 设置全站壁纸（输入图片 URL）
  - 修改管理员密码

---

## 目录结构

```
├── index.html              # 博客前端（单文件）
├── functions/
│   └── api/
│       ├── config.js       # 云端配置 API（壁纸、密码）
│       └── links.js        # 文章数据 API（增删改查）
├── README.md
└── LICENSE
```

---

## 快速修改默认密码

1. 登录管理员后台后，右上角设置面板
2. 输入新密码 → 点击 **保存**
3. 密码会自动同步到云端

---

## License

MIT — 基于 [LxCheeseRoll/smart-nav](https://github.com/LxCheeseRoll/smart-nav) 改造
