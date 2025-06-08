# 开发任务文档

## 合约开发任务

### 添加新智能合约
**描述**: 在项目中添加新的智能合约并集成到前端

**涉及文件**:
- `packages/hardhat/contracts/` - 新合约文件
- `packages/hardhat/deploy/` - 部署脚本
- `packages/hardhat/test/` - 测试文件
- `packages/nextjs/contracts/deployedContracts.ts` - 自动生成的合约类型

**工作流程**:
1. 在`contracts/`目录创建新的Solidity合约
2. 在`deploy/`目录添加部署脚本（按编号命名）
3. 编写对应的测试文件
4. 运行`yarn deploy`重新部署所有合约
5. 前端会自动获取新合约的ABI和地址

**注意事项**:
- 部署脚本命名要按顺序（01_, 02_等）
- 确保合约构造函数参数正确
- 新合约会自动出现在Debug页面

### 修改网络配置
**描述**: 添加或修改支持的区块链网络

**涉及文件**:
- `packages/nextjs/scaffold.config.ts` - 前端网络配置
- `packages/hardhat/hardhat.config.ts` - 合约部署网络配置

**工作流程**:
1. 在hardhat.config.ts中添加新网络配置
2. 在scaffold.config.ts中更新targetNetworks
3. 配置相应的RPC端点和API密钥
4. 测试网络连接和合约部署

## 前端开发任务

### 添加新页面
**描述**: 在Next.js应用中添加新的页面和路由

**涉及文件**:
- `packages/nextjs/app/` - 页面文件
- `packages/nextjs/components/` - 组件文件

**工作流程**:
1. 在`app/`目录下创建新的路由文件夹
2. 添加`page.tsx`和必要的组件文件
3. 更新导航组件（如果需要）
4. 确保页面支持SSR和响应式设计

### 创建新的Web3组件
**描述**: 开发可复用的Web3交互组件

**涉及文件**:
- `packages/nextjs/components/scaffold-eth/` - 组件实现
- `packages/nextjs/hooks/scaffold-eth/` - 自定义hooks

**工作流程**:
1. 在相应目录创建组件文件
2. 使用Scaffold-ETH hooks进行Web3交互
3. 确保TypeScript类型安全
4. 添加到index文件中导出

## 部署任务

### 部署到测试网
**描述**: 将合约部署到测试网络并配置前端

**涉及文件**:
- `packages/hardhat/.env` - 环境变量配置
- 网络配置文件

**工作流程**:
1. 配置部署账户私钥
2. 确保有足够的测试代币
3. 运行`yarn deploy --network <testnet>`
4. 验证合约在区块浏览器上
5. 更新前端网络配置

### 生产环境部署
**描述**: 部署到主网和配置生产环境

**涉及文件**:
- Vercel配置文件
- 环境变量设置

**工作流程**:
1. 配置生产环境API密钥
2. 部署合约到主网
3. 使用Vercel部署前端
4. 配置域名和IPFS选项
5. 进行生产环境测试

## 开发最佳实践

### 代码质量检查
**常用命令**:
```bash
yarn lint          # 检查代码质量
yarn format        # 格式化代码
yarn test          # 运行测试
yarn check-types   # TypeScript类型检查
```

### Git工作流
1. 使用feature分支进行开发
2. 提交前自动运行lint-staged
3. 确保所有测试通过
4. 合并前进行代码审查

### 调试技巧
- 使用Debug Contracts页面测试合约功能
- 利用Block Explorer查看交易详情
- 查看Hardhat控制台输出调试信息
- 使用浏览器开发者工具调试前端