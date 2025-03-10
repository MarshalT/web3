# Web3 批量转账工具

这是一个基于Web3技术的DApp（去中心化应用），主要用于实现批量转账功能和交易记录查询的工具。

## 技术栈

### 前端框架和库
- React 18.2.0 - 用户界面构建
- Ant Design 5.11.1 - UI组件库
- Vite 4.4.5 - 构建工具

### Web3相关
- Web3.js 4.2.2 - 以太坊交互
- Ethers.js 6.8.1 - 以太坊交互增强库

### 其他工具
- XLSX 0.18.5 - Excel文件处理
- gh-pages 6.3.0 - GitHub Pages部署

## 项目结构

```
web3/
├── src/                    # 源代码目录
│   ├── components/        # React组件
│   ├── App.jsx           # 主应用组件
│   ├── main.jsx         # 应用入口
│   └── index.css        # 全局样式
├── contracts/            # 智能合约目录
├── dist/                # 构建输出目录
├── public/              # 静态资源
├── index.html           # HTML入口文件
├── vite.config.js       # Vite配置
└── package.json         # 项目依赖配置
```

## 主要功能

1. 批量转账
   - 支持Excel文件上传
   - 支持多地址批量转账
   - 交易确认和状态追踪

2. 交易记录查询
   - 历史交易记录查看
   - 交易状态实时更新
   - Arbiscan链接集成

## 开发环境设置

1. 安装依赖
```bash
npm install
```

2. 启动开发服务器
```bash
npm run dev
```

3. 构建生产版本
```bash
npm run build
```

4. 预览生产版本
```bash
npm run preview
```

## GitHub Pages部署指南

### 1. 前期准备

1. 确保你的GitHub仓库已经创建并初始化
2. 确保本地代码已经推送到GitHub仓库
3. 检查package.json中是否包含正确的homepage字段：
   ```json
   {
     "homepage": "https://[你的GitHub用户名].github.io/[仓库名]"
   }
   ```

### 2. 配置部署脚本

1. 安装gh-pages包（如果尚未安装）：
   ```bash
   npm install gh-pages --save-dev
   ```

2. 在package.json中添加部署脚本：
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

### 3. Vite配置调整

1. 在vite.config.js中添加base配置：
   ```javascript
   export default defineConfig({
     base: '/[仓库名]/',
     // ... 其他配置
   })
   ```

### 4. 部署步骤

1. 确保所有代码更改已提交到Git：
   ```bash
   git add .
   git commit -m "准备部署到GitHub Pages"
   git push origin main
   ```

2. 运行部署命令：
   ```bash
   npm run deploy
   ```

3. 部署完成后，等待几分钟，然后访问：
   ```
   https://[你的GitHub用户名].github.io/[仓库名]
   ```

### 5. 故障排除

- 如果部署后页面显示404：
  - 检查GitHub仓库设置中的Pages设置是否正确
  - 确认gh-pages分支是否已创建并设置为部署源
  - 验证vite.config.js中的base配置是否正确

- 如果资源加载失败：
  - 检查vite.config.js中的base配置
  - 确保所有资源路径使用相对路径

- 如果部署命令失败：
  - 确保有正确的GitHub访问权限
  - 检查是否正确配置了Git凭据

### 6. 自动化部署（可选）

可以配置GitHub Actions实现自动部署：

1. 在仓库中创建`.github/workflows/deploy.yml`文件：
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install Dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Deploy
        uses: JamesIves/github-pages-deploy-action@4.1.5
        with:
          branch: gh-pages
          folder: dist
```

## 浏览器钱包要求

- 需要安装MetaMask或其他Web3钱包
- 支持以太坊网络

## 注意事项

- 使用前请确保已连接到正确的网络
- 批量转账前请确保账户有足够的ETH余额
- 请妥善保管私钥和助记词
- 建议在进行大额转账前先进行小额测试

## License

MIT 