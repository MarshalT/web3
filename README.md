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

## 部署

项目使用GitHub Pages进行部署，可以通过以下命令部署：

```bash
npm run deploy
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