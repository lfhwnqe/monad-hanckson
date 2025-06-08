import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * 部署Gomoku五子棋合约
 */
const deployGomoku: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("Gomoku", {
    from: deployer,
    // 合约构造函数参数（如果有）
    args: [],
    log: true,
    // 自动挖矿（适用于本地开发）
    autoMine: true,
  });

  // 获取部署的合约实例
  const gomoku = await hre.ethers.getContract<Contract>("Gomoku", deployer);
  console.log("👋 Gomoku contract deployed at:", await gomoku.getAddress());
};

export default deployGomoku;

// 标签用于选择性部署
deployGomoku.tags = ["Gomoku"];
