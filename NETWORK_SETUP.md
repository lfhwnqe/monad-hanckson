# 五子棋DApp 局域网部署指南

## 问题描述
默认情况下，Hardhat只监听localhost(127.0.0.1)，其他设备无法通过局域网IP访问。

## 解决方案

### 1. 启动Hardhat节点（支持局域网访问）

在 `packages/hardhat` 目录下运行：

```bash
# 方法1：使用--hostname参数监听所有网络接口
npx hardhat node --hostname 0.0.0.0

# 方法2：直接指定你的局域网IP
npx hardhat node --hostname 10.1.11.45
```

### 2. 配置前端RPC地址

已经配置了环境变量支持，在 `packages/nextjs/.env.local` 中：

```bash
NEXT_PUBLIC_HARDHAT_RPC_URL=http://10.1.11.45:8545
```

### 3. 部署合约

在新的终端窗口中，在 `packages/hardhat` 目录下：

```bash
# 编译合约
yarn compile

# 部署到本地网络
yarn deploy --network localhost
```

### 4. 启动前端

在 `packages/nextjs` 目录下：

```bash
yarn start
```

## 验证步骤

1. **检查Hardhat节点**: 访问 `http://10.1.11.45:8545` 应该看到JSON-RPC响应
2. **检查合约部署**: 部署成功后会显示合约地址
3. **检查前端连接**: 前端应该能连接钱包并显示正确的网络

## 常见问题

### Q: 其他设备仍然无法访问？
A: 检查防火墙设置，确保8545端口对局域网开放：
```bash
# macOS
sudo pfctl -d  # 临时禁用防火墙测试

# Linux 
sudo ufw allow 8545

# Windows
# 在Windows防火墙中添加8545端口入站规则
```

### Q: 前端显示网络错误？
A: 确保 `.env.local` 中的IP地址正确，并且Hardhat节点正在运行

### Q: 钱包连接问题？
A: 在MetaMask中添加自定义网络：
- 网络名称: Hardhat Local
- RPC URL: http://10.1.11.45:8545  
- 链ID: 31337
- 货币符号: ETH

## 完整启动序列

```bash
# Terminal 1: 启动Hardhat节点
cd packages/hardhat
npx hardhat node --hostname 0.0.0.0

# Terminal 2: 部署合约
cd packages/hardhat  
yarn deploy --network localhost

# Terminal 3: 启动前端
cd packages/nextjs
yarn start
```

现在局域网中的其他设备应该可以访问 `http://10.1.11.45:3000` 来使用五子棋DApp了！

## 🎮 游戏模式

### 对战模式
- 两个不同的钱包地址进行对战
- 黑棋先手，白棋后手
- 需要等待另一个玩家加入游戏

### 练习模式 🎯
为了方便测试，我们增加了练习模式：
- **单人操作**: 一个钱包地址控制黑白双方
- **即时开始**: 创建后立即进入游戏，无需等待
- **轮流下棋**: 自动轮换黑白棋子
- **完整功能**: 支持胜负判定和游戏结束
- **不计统计**: 练习模式的结果不会计入个人胜负记录

### 如何使用练习模式
1. 连接钱包后，点击"开始练习"按钮
2. 系统会创建一个练习游戏并直接进入棋盘
3. 点击任意空位即可下棋
4. 系统自动轮换黑白棋子（黑棋先手）
5. 达成五子连线即可获胜

这样就可以在只有一个钱包的情况下完整测试五子棋的所有功能了！