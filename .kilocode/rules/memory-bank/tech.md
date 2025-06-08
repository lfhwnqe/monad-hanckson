# 技术栈文档

## 开发环境要求
- **Node.js**: >= v20.18.3
- **包管理器**: Yarn v3.2.3
- **Git**: 最新版本

## 核心技术栈

### 智能合约开发
- **Solidity**: ^0.8.20
- **Hardhat**: ^2.22.10 - 开发框架
- **OpenZeppelin**: ^5.0.2 - 安全合约库
- **TypeChain**: ^8.3.2 - TypeScript类型生成
- **Ethers.js**: ^6.13.2 - 以太坊交互库

### 前端开发
- **Next.js**: ^15.2.3 - React框架
- **React**: ^19.0.0 - UI库
- **TypeScript**: ^5.8.2 - 类型系统
- **Tailwind CSS**: ^4.1.3 - 样式框架
- **DaisyUI**: ^5.0.9 - UI组件库

### Web3集成
- **Wagmi**: 2.15.4 - React Hooks for Ethereum
- **Viem**: 2.30.0 - TypeScript以太坊接口
- **RainbowKit**: 2.2.5 - 钱包连接UI
- **TanStack Query**: ^5.59.15 - 数据获取和缓存

### 开发工具
- **ESLint**: ^9.23.0 - 代码检查
- **Prettier**: ^3.5.3 - 代码格式化
- **Husky**: ^9.1.6 - Git hooks
- **lint-staged**: ^15.2.10 - 暂存文件检查

## 项目配置

### 包管理器配置
```json
{
  "packageManager": "yarn@3.2.3",
  "workspaces": {
    "packages": ["packages/hardhat", "packages/nextjs"]
  }
}
```

### TypeScript配置
- 严格模式启用
- 智能合约ABI自动类型生成
- Next.js和React 19兼容配置

### 网络配置
```typescript
// 默认网络: Hardhat本地网络
targetNetworks: [chains.hardhat]

// 支持的主网和测试网
- Ethereum (Mainnet/Sepolia)
- Arbitrum (Mainnet/Sepolia)
- Optimism (Mainnet/Sepolia)
- Polygon (Mainnet/Amoy)
- Base (Mainnet/Sepolia)
- Gnosis, Scroll, Celo等
```

## 开发工作流

### 启动流程
```bash
# 1. 启动本地区块链
yarn chain

# 2. 部署智能合约
yarn deploy

# 3. 启动前端应用
yarn start
```

### 常用命令
```bash
# 智能合约相关
yarn hardhat:compile    # 编译合约
yarn hardhat:test      # 运行测试
yarn hardhat:deploy    # 部署合约
yarn account:generate  # 生成账户

# 前端相关
yarn next:build        # 构建应用
yarn next:lint         # 代码检查
yarn format           # 格式化代码
```

## 技术约束

### 智能合约
- Solidity版本锁定在0.8.20
- 必须通过OpenZeppelin安全审计的组件
- Gas优化设置runs: 200
- 强制类型安全检查

### 前端应用
- 严格的TypeScript配置
- 必须支持SSR (Next.js)
- 响应式设计要求
- Web3钱包兼容性

## API密钥配置
- **Alchemy**: 默认使用共享密钥，生产环境需替换
- **WalletConnect**: 项目ID需要配置
- **Etherscan**: 合约验证需要API密钥

## 部署配置

### 本地开发
- Hardhat网络自动分叉主网
- 内置水龙头和燃烧钱包
- 热重载支持

### 生产部署
- 支持Vercel一键部署
- IPFS部署支持
- 多链环境变量配置

## 性能优化
- 智能合约编译器优化
- Next.js图片和字体优化
- Wagmi查询缓存优化
- 网络RPC故障转移机制

## 安全考虑
- 私钥环境变量加密存储
- 合约所有权和访问控制
- 前端XSS和CSRF防护
- RPC端点安全配置