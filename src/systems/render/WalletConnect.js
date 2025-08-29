// FlexNetJSX Wallet Connection Component
// SUI wallet connection interface for Karen on SUI application

import { createElement, useState, useEffect } from './jsx.js';
import { subscribe, selectIsConnected, selectUserAddress, selectKRNBalance, selectIsConnecting, selectWalletError } from '../state/index.js';
import { WalletManager, KRNTokenManager, BalancePoller } from '../wallet/sui.js';

// ===== WALLET CONNECT COMPONENT =====

const WalletConnect = ({ onConnect, onDisconnect }) => {
  const [state, setState] = useState({
    isConnected: false,
    address: null,
    krnBalance: 0,
    isConnecting: false,
    error: null
  });

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = subscribe((appState) => {
      setState({
        isConnected: selectIsConnected(appState),
        address: selectUserAddress(appState),
        krnBalance: selectKRNBalance(appState),
        isConnecting: selectIsConnecting(appState),
        error: selectWalletError(appState)
      });
    });

    return unsubscribe;
  }, []);

  // Handle wallet connection
  const handleConnect = async () => {
    try {
      const result = await WalletManager.connect();
      
      if (result.isSuccess()) {
        // Start balance polling
        BalancePoller.start();
        
        // Notify parent component
        if (onConnect) {
          onConnect(result.value);
        }
      } else {
        console.error('Wallet connection failed:', result.value);
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
    }
  };

  // Handle wallet disconnection
  const handleDisconnect = async () => {
    try {
      await WalletManager.disconnect();
      
      // Stop balance polling
      BalancePoller.stop();
      
      // Notify parent component
      if (onDisconnect) {
        onDisconnect();
      }
    } catch (error) {
      console.error('Wallet disconnection error:', error);
    }
  };

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format balance for display
  const formatBalance = (balance) => {
    return balance.toFixed(2);
  };

  // Render connection button
  const renderConnectButton = () => {
    if (state.isConnecting) {
      return createElement('button', {
        className: 'btn btn-connecting',
        disabled: true
      }, 'Connecting...');
    }

    return createElement('button', {
      className: 'btn btn-primary',
      onClick: handleConnect
    }, 'Connect Wallet');
  };

  // Render wallet info
  const renderWalletInfo = () => {
    return createElement('div', { className: 'wallet-info' },
      createElement('div', { className: 'wallet-address' },
        createElement('span', { className: 'label' }, 'Address: '),
        createElement('span', { className: 'value' }, formatAddress(state.address))
      ),
      createElement('div', { className: 'wallet-balance' },
        createElement('span', { className: 'label' }, 'KRN Balance: '),
        createElement('span', { className: 'value' }, `${formatBalance(state.krnBalance)} KRN`)
      ),
      createElement('button', {
        className: 'btn btn-secondary btn-sm',
        onClick: handleDisconnect
      }, 'Disconnect')
    );
  };

  // Render error message
  const renderError = () => {
    if (!state.error) return null;

    return createElement('div', { className: 'wallet-error' },
      createElement('p', { className: 'error-message' }, state.error),
      createElement('button', {
        className: 'btn btn-secondary btn-sm',
        onClick: () => setState(prev => ({ ...prev, error: null }))
      }, 'Dismiss')
    );
  };

  // Main render
  return createElement('div', { className: 'wallet-connect' },
    state.error && renderError(),
    
    state.isConnected 
      ? renderWalletInfo()
      : renderConnectButton()
  );
};

// ===== WALLET STATUS COMPONENT =====

const WalletStatus = () => {
  const [state, setState] = useState({
    isConnected: false,
    address: null,
    krnBalance: 0
  });

  useEffect(() => {
    const unsubscribe = subscribe((appState) => {
      setState({
        isConnected: selectIsConnected(appState),
        address: selectUserAddress(appState),
        krnBalance: selectKRNBalance(appState)
      });
    });

    return unsubscribe;
  }, []);

  if (!state.isConnected) {
    return createElement('div', { className: 'wallet-status disconnected' },
      createElement('span', { className: 'status-indicator' }, '●'),
      createElement('span', { className: 'status-text' }, 'Not Connected')
    );
  }

  return createElement('div', { className: 'wallet-status connected' },
    createElement('span', { className: 'status-indicator' }, '●'),
    createElement('span', { className: 'status-text' }, 
      `${formatAddress(state.address)} - ${formatBalance(state.krnBalance)} KRN`
    )
  );
};

// ===== KRN BALANCE COMPONENT =====

const KRNBalance = () => {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribe((appState) => {
      setBalance(selectKRNBalance(appState));
    });

    return unsubscribe;
  }, []);

  return createElement('div', { className: 'krn-balance' },
    createElement('span', { className: 'balance-label' }, 'KRN:'),
    createElement('span', { className: 'balance-value' }, formatBalance(balance))
  );
};

// ===== WALLET MODAL COMPONENT =====

const WalletModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return createElement('div', { 
    className: 'modal-backdrop',
    onClick: handleBackdropClick
  },
    createElement('div', { className: 'modal-content' },
      createElement('div', { className: 'modal-header' },
        createElement('h3', null, 'Connect Wallet'),
        createElement('button', {
          className: 'modal-close',
          onClick: onClose
        }, '×')
      ),
      createElement('div', { className: 'modal-body' },
        createElement(WalletConnect, {
          onConnect: () => onClose(),
          onDisconnect: () => onClose()
        })
      )
    )
  );
};

// ===== UTILITY FUNCTIONS =====

const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatBalance = (balance) => {
  return balance.toFixed(2);
};

// ===== EXPORTS =====

export {
  WalletConnect,
  WalletStatus,
  KRNBalance,
  WalletModal,
  formatAddress,
  formatBalance
};
