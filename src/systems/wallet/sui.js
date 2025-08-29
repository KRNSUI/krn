// FlexNetJSX SUI Wallet Integration
// SUI blockchain wallet connection and KRN token management for Karen on SUI

import { Maybe, Either, Result, Effect } from '../../core/types/index.js';
import { compose, pipe, curry, tap } from '../../core/functions/index.js';
import { dispatch, userActions, walletActions } from '../state/index.js';
// Import wallet functions - will be loaded dynamically
let walletFunctions = null;

// Load wallet functions dynamically
const loadWalletFunctions = async () => {
  if (!walletFunctions) {
    try {
      walletFunctions = await import('../../../public/slush.js');
    } catch (error) {
      console.error('Failed to load wallet functions:', error);
      // Provide fallback functions
      walletFunctions = {
        connectWallet: async () => { throw new Error('Wallet functions not loaded'); },
        getAddress: () => null,
        getWallet: () => null,
        getKRBalance: async () => 0,
        disconnectWallet: async () => {}
      };
    }
  }
  return walletFunctions;
};

// ===== SUI CONSTANTS =====

const SUI_NETWORKS = {
  MAINNET: 'mainnet',
  TESTNET: 'testnet',
  DEVNET: 'devnet'
};

const KRN_TOKEN_ADDRESS = '0x278c12e3bcc279248ea3e316ca837244c3941399f2bf4598638f4a8be35c09aa::krn::KRN';

const ROUTER_ADDRESS = '0x96316f7a36429d5546ebe26478fbf30b490da22feea4c1f7c5bd36c3b6436dc::router_dao::Config';

// ===== WALLET PROVIDERS =====

// Enhanced Sui Wallet provider
const SuiWalletProvider = {
  name: 'Sui Wallet',
  
  // Check if Sui Wallet is available
  isAvailable: () => {
    return Maybe.fromNullable(window.suiWallet)
      .map(() => true)
      .fold(() => false);
  },
  
  // Get Sui Wallet instance
  getInstance: () => {
    return Maybe.fromNullable(window.suiWallet)
      .fold(() => Either.Left('Sui Wallet not found'), Either.Right);
  },
  
  // Connect to Sui Wallet
  connect: async () => {
    try {
      const functions = await loadWalletFunctions();
      const address = await functions.connectWallet();
      return Result.Success(address);
    } catch (error) {
      return Result.Failure(error.message);
    }
  },
  
  // Disconnect from Sui Wallet
  disconnect: async () => {
    try {
      const functions = await loadWalletFunctions();
      await functions.disconnectWallet();
      return Result.Success();
    } catch (error) {
      return Result.Failure(error.message);
    }
  },
  
  // Get account info
  getAccount: async () => {
    const functions = await loadWalletFunctions();
    const address = functions.getAddress();
    if (!address) {
      return Result.Failure('No wallet connected');
    }
    return Result.Success(address);
  },
  
  // Get network
  getNetwork: async () => {
    const functions = await loadWalletFunctions();
    const wallet = functions.getWallet();
    if (!wallet) {
      return Result.Failure('No wallet connected');
    }
    
    try {
      const network = await wallet.provider.getNetwork();
      return Result.Success(network);
    } catch (error) {
      return Result.Success('mainnet'); // Default to mainnet
    }
  }
};

// ===== WALLET MANAGER =====

const WalletManager = {
  currentProvider: null,
  
  // Get available providers
  getAvailableProviders: () => {
    const providers = [];
    
    if (SuiWalletProvider.isAvailable()) {
      providers.push(SuiWalletProvider);
    }
    
    return providers;
  },
  
  // Set provider
  setProvider: (provider) => {
    WalletManager.currentProvider = provider;
    dispatch(walletActions.setProvider(provider.name));
  },
  
  // Connect wallet
  connect: async () => {
    dispatch(walletActions.startConnecting());
    
    try {
      const functions = await loadWalletFunctions();
      const address = await functions.connectWallet();
      
      if (address) {
        // Get wallet info
        const wallet = functions.getWallet();
        const provider = wallet ? SuiWalletProvider : null;
        
        if (provider) {
          WalletManager.setProvider(provider);
        }
        
        dispatch(userActions.connectWallet(address));
        dispatch(walletActions.setWalletError(null));
        
        return Result.Success(address);
      } else {
        const error = 'Failed to connect wallet';
        dispatch(walletActions.setWalletError(error));
        return Result.Failure(error);
      }
    } catch (error) {
      dispatch(walletActions.setWalletError(error.message));
      return Result.Failure(error.message);
    }
  },
  
  // Disconnect wallet
  disconnect: async () => {
    try {
      const functions = await loadWalletFunctions();
      await functions.disconnectWallet();
      dispatch(userActions.disconnectWallet());
      WalletManager.currentProvider = null;
      return Result.Success();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      return Result.Failure(error.message);
    }
  },
  
  // Get current account
  getCurrentAccount: async () => {
    const functions = await loadWalletFunctions();
    const address = functions.getAddress();
    if (!address) {
      return Result.Failure('No wallet connected');
    }
    return Result.Success(address);
  },
  
  // Get current network
  getCurrentNetwork: async () => {
    const functions = await loadWalletFunctions();
    const wallet = functions.getWallet();
    if (!wallet) {
      return Result.Failure('No wallet connected');
    }
    
    try {
      const network = await wallet.provider.getNetwork();
      return Result.Success(network);
    } catch (error) {
      return Result.Success('mainnet'); // Default to mainnet
    }
  }
};

// ===== KRN TOKEN MANAGEMENT =====

const KRNTokenManager = {
  // Get KRN balance
  getKRBalance: async (address) => {
    if (!address) {
      return Result.Failure('Address required');
    }
    
    try {
      const functions = await loadWalletFunctions();
      const balance = await functions.getKRBalance(address);
      return Result.Success(balance);
    } catch (error) {
      return Result.Failure(error.message);
    }
  },
  
  // Get SUI balance
  getSUIBalance: async (address) => {
    if (!address) {
      return Result.Failure('Address required');
    }
    
    try {
      const response = await fetch(`https://fullnode.mainnet.sui.io:443`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'suix_getBalance',
          params: [address]
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        return Result.Failure(data.error.message);
      }
      
      const balance = parseInt(data.result.totalBalance) / Math.pow(10, 9);
      return Result.Success(balance);
    } catch (error) {
      return Result.Failure(error.message);
    }
  },
  
  // Execute KRN transaction (favorite, unfavorite, flag)
  executeKRTransaction: async (action, itemId, amount = 1) => {
    const accountResult = await WalletManager.getCurrentAccount();
    
    if (accountResult.isFailure()) {
      return accountResult;
    }
    
    const account = accountResult.value;
    
    try {
      // Use the payOneKRN function from slush.js
      const functions = await loadWalletFunctions();
      
      const result = await functions.payOneKRN({
        memo: `${action}:${itemId}`
      });
      
      return Result.Success(result);
    } catch (error) {
      return Result.Failure(error.message);
    }
  },
  
  // Check if user has enough KRN for action
  hasEnoughKRN: async (requiredAmount = 1) => {
    const accountResult = await WalletManager.getCurrentAccount();
    
    if (accountResult.isFailure()) {
      return Result.Failure('No wallet connected');
    }
    
    const balanceResult = await KRNTokenManager.getKRBalance(accountResult.value);
    
    if (balanceResult.isFailure()) {
      return balanceResult;
    }
    
    const hasEnough = balanceResult.value >= requiredAmount;
    return Result.Success(hasEnough);
  }
};

// ===== BALANCE POLLING =====

const BalancePoller = {
  interval: null,
  
  // Start polling balances
  start: () => {
    if (BalancePoller.interval) {
      return;
    }
    
    BalancePoller.interval = setInterval(async () => {
      const accountResult = await WalletManager.getCurrentAccount();
      
      if (accountResult.isSuccess()) {
        const account = accountResult.value;
        
        // Get KRN balance
        const krnBalanceResult = await KRNTokenManager.getKRBalance(account);
        if (krnBalanceResult.isSuccess()) {
          dispatch(userActions.updateBalance({ KRN: krnBalanceResult.value }));
        }
        
        // Get SUI balance
        const suiBalanceResult = await KRNTokenManager.getSUIBalance(account);
        if (suiBalanceResult.isSuccess()) {
          dispatch(userActions.updateBalance({ SUI: suiBalanceResult.value }));
        }
      }
    }, 10000); // Poll every 10 seconds
  },
  
  // Stop polling
  stop: () => {
    if (BalancePoller.interval) {
      clearInterval(BalancePoller.interval);
      BalancePoller.interval = null;
    }
  }
};

// ===== EXPORTS =====

export {
  SUI_NETWORKS,
  KRN_TOKEN_ADDRESS,
  ROUTER_ADDRESS,
  SuiWalletProvider,
  WalletManager,
  KRNTokenManager,
  BalancePoller
};
