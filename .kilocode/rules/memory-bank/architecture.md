# 系统架构文档

## 整体架构
采用现代化的Web3全栈monorepo架构，分为智能合约层和前端应用层两个主要部分。

## 项目结构
```
/
├── packages/
│   ├── hardhat/          # 智能合约开发环境
│   └── nextjs/           # Web3前端应用
├── .kilocode/            # 项目配置和规则
└── 配置文件              # 工作区级别配置
```

## 智能合约层 (`packages/hardhat/`)
### 核心路径
- `contracts/YourContract.sol` - 主示例智能合约
- `deploy/00_deploy_your_contract.ts` - 部署脚本
- `hardhat.config.ts` - Hardhat配置和网络设置
- `test/YourContract.ts` - 合约测试文件

### 架构特点
- **框架**: Hardhat + TypeScript
- **合约标准**: Solidity ^0.8.20，集成OpenZeppelin
- **部署系统**: hardhat-deploy插件，支持多网络
- **测试框架**: Chai + Mocha，集成Gas报告
- **类型生成**: 自动生成TypeScript ABI

### 支持的网络
- **本地**: Hardhat本地网络，支持主网分叉
- **测试网**: Sepolia, Optimism Sepolia, Base Sepolia等
- **主网**: Ethereum, Arbitrum, Optimism, Polygon, Base等

## 前端应用层 (`packages/nextjs/`)
### 核心路径
- `app/` - Next.js 15 App Router结构
  - `page.tsx` - 主页面
  - `debug/` - 合约调试界面
  - `blockexplorer/` - 区块浏览器
- `components/scaffold-eth/` - Web3组件库
- `hooks/scaffold-eth/` - 自定义Web3 Hooks
- `services/web3/` - Web3服务配置
- `utils/scaffold-eth/` - 工具函数库

### 架构模式
- **UI框架**: Next.js 15 + React 19
- **样式系统**: Tailwind CSS + DaisyUI
- **Web3集成**: Wagmi v2 + Viem + RainbowKit
- **状态管理**: Zustand + React Query
- **类型安全**: TypeScript + 自动生成的合约类型

## 关键架构决策

### 1. 合约热重载系统
```typescript
// 自动生成TypeScript ABI绑定
packages/hardhat/scripts/generateTsAbis.ts
packages/nextjs/contracts/deployedContracts.ts
```

### 2. Web3配置架构
```typescript
// 中心化配置
packages/nextjs/scaffold.config.ts
// Wagmi客户端配置
packages/nextjs/services/web3/wagmiConfig.tsx
```

### 3. 组件复用模式
```typescript
// 标准化的Web3组件
components/scaffold-eth/Address/
components/scaffold-eth/Input/
components/scaffold-eth/RainbowKitCustomConnectButton/
```

### 4. Hook抽象层
```typescript
// 封装Wagmi的高级Hooks
hooks/scaffold-eth/useScaffoldContract.ts
hooks/scaffold-eth/useScaffoldReadContract.ts
hooks/scaffold-eth/useScaffoldWriteContract.ts
```

## 数据流架构

### 合约部署流程
1. 编写Solidity合约 → `contracts/`
2. 配置部署脚本 → `deploy/`
3. 执行部署 → `yarn deploy`
4. 自动生成TypeScript类型 → `contracts/deployedContracts.ts`
5. 前端自动获取合约ABI和地址

### 前端交互流程
1. 用户操作UI组件
2. 调用Scaffold-ETH hooks
3. Hooks使用Wagmi与区块链交互
4. 实时更新UI状态和数据

## 关键集成点

### 1. 合约与前端的类型同步
- 部署后自动生成TypeScript类型
- 前端获得完整的类型安全支持

### 2. 多网络支持
- 统一的网络配置系统
- 自动切换RPC端点
- 支持自定义网络覆盖

### 3. 开发工具集成
- 内置区块浏览器
- 合约调试界面
- 实时Gas费用跟踪

## 扩展性设计
- 模块化的组件系统便于定制
- Hook抽象层支持复杂业务逻辑
- 灵活的网络配置支持新链集成
- 标准化的部署流程支持多合约项目