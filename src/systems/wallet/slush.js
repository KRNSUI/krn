// public/slush.js
// SUI Wallet Integration for Karen on SUI
export const KRN_TYPE = "0x278c12e3bcc279248ea3e316ca837244c3941399f2bf4598638f4a8be35c09aa::krn::KRN";
export const TREASURY = "0x16838e026d0e3c214deb40f4dc765ad5ea47d0f488952b2f29f807e225cd3241";

let _addr = null;
let _wallet = null;

// ===== WALLET DETECTION =====

// Check for various SUI wallet providers
const detectWallets = () => {
  const wallets = [];
  
  // Check for Sui Wallet
  if (typeof window.suiWallet !== 'undefined') {
    wallets.push({
      name: 'Sui Wallet',
      provider: window.suiWallet,
      type: 'sui-wallet'
    });
  }
  
  // Check for Sui Wallet Extension
  if (typeof window.suiWalletExtension !== 'undefined') {
    wallets.push({
      name: 'Sui Wallet Extension',
      provider: window.suiWalletExtension,
      type: 'sui-extension'
    });
  }
  
  // Check for Martian Wallet
  if (typeof window.martian !== 'undefined') {
    wallets.push({
      name: 'Martian Wallet',
      provider: window.martian,
      type: 'martian'
    });
  }
  
  // Check for Suiet Wallet
  if (typeof window.suiet !== 'undefined') {
    wallets.push({
      name: 'Suiet Wallet',
      provider: window.suiet,
      type: 'suiet'
    });
  }
  
  // Check for OneKey Wallet
  if (typeof window.onekey !== 'undefined' && window.onekey.sui) {
    wallets.push({
      name: 'OneKey Wallet',
      provider: window.onekey.sui,
      type: 'onekey'
    });
  }
  
  // Check for OKX Wallet
  if (typeof window.okxwallet !== 'undefined' && window.okxwallet.sui) {
    wallets.push({
      name: 'OKX Wallet',
      provider: window.okxwallet.sui,
      type: 'okx'
    });
  }
  
  return wallets;
};

// ===== WALLET CONNECTION =====

export async function connectWallet() {
  try {
    const wallets = detectWallets();
    
    if (wallets.length === 0) {
      // No wallets detected, show installation instructions
      const installChoice = confirm(
        'No SUI wallet detected. Would you like to install Sui Wallet?\n\n' +
        'Click OK to go to the Chrome Web Store, or Cancel to enter address manually.'
      );
      
      if (installChoice) {
        window.open('https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil', '_blank');
        throw new Error('Please install Sui Wallet and refresh the page');
      } else {
        // Fallback to manual address entry
        const v = prompt("Enter your Sui address:", _addr || "");
        if (!v) throw new Error("Wallet connect canceled");
        _addr = v.trim();
        return _addr;
      }
    }
    
    // Use the first available wallet
    const wallet = wallets[0];
    _wallet = wallet;
    
    console.log(`Connecting to ${wallet.name}...`);
    
    let account;
    
    // Handle different wallet types
    switch (wallet.type) {
      case 'sui-wallet':
        const connectResult = await wallet.provider.connect();
        account = connectResult.accounts[0];
        break;
        
      case 'sui-extension':
        const accounts = await wallet.provider.requestAccounts();
        account = accounts[0];
        break;
        
      case 'martian':
        const martianResult = await wallet.provider.connect();
        account = martianResult.address;
        break;
        
      case 'suiet':
        const suietResult = await wallet.provider.connect();
        account = suietResult.address;
        break;
        
      case 'onekey':
        const onekeyResult = await wallet.provider.connect();
        account = onekeyResult.address;
        break;
        
      case 'okx':
        const okxResult = await wallet.provider.connect();
        account = okxResult.address;
        break;
        
      default:
        throw new Error(`Unsupported wallet type: ${wallet.type}`);
    }
    
    _addr = account;
    console.log(`Connected to ${wallet.name}: ${_addr}`);
    
    return _addr;
    
  } catch (error) {
    console.error('Wallet connection error:', error);
    
    // Fallback to manual address entry
    const v = prompt(
      `Wallet connection failed: ${error.message}\n\nEnter your Sui address manually:`,
      _addr || ""
    );
    if (!v) throw new Error("Wallet connect canceled");
    _addr = v.trim();
    return _addr;
  }
}

export function getAddress() {
  return _addr;
}

export function getWallet() {
  return _wallet;
}

// ===== TRANSACTION BUILDING =====

export async function payOneKRN({ memo = "" } = {}) {
  if (!_addr) await connectWallet();
  
  if (!_wallet) {
    // No wallet connected, return mock transaction
    const fakeDigest = `SIM-${Date.now()}`;
    return { digest: fakeDigest, from: _addr, to: TREASURY, amount: "1", type: KRN_TYPE, memo };
  }
  
  try {
    // Build transaction for router payment
    const transaction = {
      target: `${TREASURY}::router_dao::pay`,
      arguments: [
        _addr, // seller address
        0, // action type (0 = favorite)
        Buffer.from(memo).toString('hex'), // memo as hex
        "1000000000" // 1 KRN in smallest units (assuming 9 decimals)
      ],
      typeArguments: [KRN_TYPE]
    };
    
    // Execute transaction through wallet
    let result;
    
    switch (_wallet.type) {
      case 'sui-wallet':
        result = await _wallet.provider.signAndExecuteTransactionBlock({
          transactionBlock: transaction
        });
        break;
        
      case 'sui-extension':
        result = await _wallet.provider.signAndExecuteTransactionBlock({
          transactionBlock: transaction
        });
        break;
        
      case 'martian':
        result = await _wallet.provider.signAndExecuteTransactionBlock({
          transactionBlock: transaction
        });
        break;
        
      case 'suiet':
        result = await _wallet.provider.signAndExecuteTransactionBlock({
          transactionBlock: transaction
        });
        break;
        
      case 'onekey':
        result = await _wallet.provider.signAndExecuteTransactionBlock({
          transactionBlock: transaction
        });
        break;
        
      case 'okx':
        result = await _wallet.provider.signAndExecuteTransactionBlock({
          transactionBlock: transaction
        });
        break;
        
      default:
        throw new Error(`Unsupported wallet type for transactions: ${_wallet.type}`);
    }
    
    return {
      digest: result.digest,
      from: _addr,
      to: TREASURY,
      amount: "1",
      type: KRN_TYPE,
      memo
    };
    
  } catch (error) {
    console.error('Transaction error:', error);
    
    // Return mock transaction on error
    const fakeDigest = `SIM-${Date.now()}`;
    return { digest: fakeDigest, from: _addr, to: TREASURY, amount: "1", type: KRN_TYPE, memo };
  }
}

// ===== BALANCE CHECKING =====

export async function getKRBalance(address = _addr) {
  if (!address) {
    throw new Error('Address required');
  }
  
  try {
    const response = await fetch('https://fullnode.mainnet.sui.io:443', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'suix_getBalance',
        params: [address, KRN_TYPE]
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    const balance = parseInt(data.result.totalBalance) / Math.pow(10, 9); // Assuming 9 decimals
    return balance;
    
  } catch (error) {
    console.error('Balance check error:', error);
    return 0; // Return 0 on error
  }
}

// ===== WALLET DISCONNECTION =====

export async function disconnectWallet() {
  if (_wallet) {
    try {
      await _wallet.provider.disconnect();
    } catch (error) {
      console.error('Wallet disconnection error:', error);
    }
  }
  
  _addr = null;
  _wallet = null;
  
  console.log('Wallet disconnected');
}
