module krn::router_dao {
    use sui::coin;
    use sui::object::{UID, ID, self};
    use sui::tx_context::{TxContext, sender};
    use sui::event;

    // ===== CONSTANTS =====
    
    // Default wallet addresses (your addresses). DAO may later update via governance.
    const COMPANY_DEFAULT:   address = @0x96316f7a36429d5546ebe26478fbf30b490da22feea4c1f7c5bd36c3b6436dc;
    const DEVELOPER_DEFAULT: address = @0x16838e026d0e3c214deb40f4dc765ad5ea47d0f488952b2f29f807e225cd3241;
    const BURN_DEFAULT:      address = @0xa204bd0d48d49fc7b8b05c8ef3fae63d1b22d157526a88b91391b41e6053157;

    // Action types
    const ACTION_FAVORITE: u8 = 0;
    const ACTION_UNFAVORITE: u8 = 1;
    const ACTION_FLAG: u8 = 2;
    const ACTION_BOT: u8 = 3;

    // ===== STRUCTS =====

    /// DAO root object and governance capability
    struct Dao has key { 
        id: UID 
    }
    
    struct GovCap has key { 
        id: UID, 
        dao: ID 
    }

    /// Config governed by the DAO
    struct Config has key {
        id: UID,
        company: address,
        developer: address,
        burn_vault: address,
        company_bps: u16,
        developer_bps: u16,
        burn_bps: u16,
    }

    /// Payment event for transparency/audit
    struct PaymentMade has copy, drop, store {
        action: u8,          // 0=favorite,1=unfavorite,2=flag,3=bot
        item: vector<u8>,    // item id bytes
        payer: address,
        amount: u64,
        to_company: u64,
        to_developer: u64,
        to_seller: u64,
        to_burn: u64,
    }

    // ===== ERRORS =====

    const EInvalidBps: u64 = 0;
    const EInvalidAction: u64 = 1;
    const EInsufficientBalance: u64 = 2;
    const EInvalidConfig: u64 = 3;

    // ===== INITIALIZATION =====

    /// One‑time initialization to create DAO, GovCap, and initial Config
    public entry fun init(ctx: &mut TxContext): (Dao, GovCap, Config) {
        let dao = Dao { id: object::new(ctx) };
        let cap = GovCap { 
            id: object::new(ctx), 
            dao: object::id(&dao) 
        };
        let cfg = Config {
            id: object::new(ctx),
            company: COMPANY_DEFAULT,
            developer: DEVELOPER_DEFAULT,
            burn_vault: BURN_DEFAULT,
            company_bps: 3000,   // 30%
            developer_bps: 500,  // 5%
            burn_bps: 500        // 5% (seller gets remainder)
        };
        (dao, cap, cfg)
    }

    // ===== DAO GOVERNANCE FUNCTIONS =====

    /// DAO‑gated setters (only callable with GovCap)
    public entry fun set_company_bps(cfg: &mut Config, _cap: &GovCap, bps: u16) {
        assert!(bps <= 10000, EInvalidBps);
        cfg.company_bps = bps;
    }
    
    public entry fun set_developer_bps(cfg: &mut Config, _cap: &GovCap, bps: u16) {
        assert!(bps <= 10000, EInvalidBps);
        cfg.developer_bps = bps;
    }
    
    public entry fun set_burn_bps(cfg: &mut Config, _cap: &GovCap, bps: u16) {
        assert!(bps <= 10000, EInvalidBps);
        cfg.burn_bps = bps;
    }
    
    public entry fun set_company_addr(cfg: &mut Config, _cap: &GovCap, addr: address) {
        cfg.company = addr;
    }
    
    public entry fun set_developer_addr(cfg: &mut Config, _cap: &GovCap, addr: address) {
        cfg.developer = addr;
    }
    
    public entry fun set_burn_vault(cfg: &mut Config, _cap: &GovCap, addr: address) {
        cfg.burn_vault = addr;
    }

    // ===== PAYMENT FUNCTIONS =====

    /// Split and route a KRN payment
    public entry fun pay<KRN>(
        cfg: &Config, 
        seller: address, 
        action: u8, 
        item: vector<u8>, 
        mut krn: coin::Coin<KRN>, 
        ctx: &mut TxContext
    ) {
        // Validate action
        assert!(action <= ACTION_BOT, EInvalidAction);
        
        // Validate config
        assert!(cfg.company_bps + cfg.developer_bps + cfg.burn_bps <= 10000, EInvalidConfig);
        
        let amount = coin::value(&krn);
        let to_company = amount * (cfg.company_bps as u64) / 10000;
        let to_developer = amount * (cfg.developer_bps as u64) / 10000;
        let to_burn = amount * (cfg.burn_bps as u64) / 10000;
        let to_seller = amount - to_company - to_developer - to_burn;

        // Split coins
        let k_company = coin::split(&mut krn, to_company, ctx);
        let k_dev = coin::split(&mut krn, to_developer, ctx);
        let k_burn = coin::split(&mut krn, to_burn, ctx);

        // Transfer to recipients
        coin::transfer(k_company, cfg.company);
        coin::transfer(k_dev, cfg.developer);
        coin::transfer(krn, seller);        // remainder → seller
        coin::transfer(k_burn, cfg.burn_vault); // or coin::burn if supported

        // Emit payment event
        event::emit(PaymentMade { 
            action, 
            item, 
            payer: sender(ctx), 
            amount, 
            to_company, 
            to_developer, 
            to_seller, 
            to_burn 
        });
    }

    // ===== VIEW FUNCTIONS =====

    /// Get payment breakdown for a given amount
    public fun get_payment_breakdown(cfg: &Config, amount: u64): (u64, u64, u64, u64) {
        let to_company = amount * (cfg.company_bps as u64) / 10000;
        let to_developer = amount * (cfg.developer_bps as u64) / 10000;
        let to_burn = amount * (cfg.burn_bps as u64) / 10000;
        let to_seller = amount - to_company - to_developer - to_burn;
        
        (to_company, to_developer, to_seller, to_burn)
    }

    /// Get current configuration
    public fun get_config(cfg: &Config): (address, address, address, u16, u16, u16) {
        (
            cfg.company,
            cfg.developer,
            cfg.burn_vault,
            cfg.company_bps,
            cfg.developer_bps,
            cfg.burn_bps
        )
    }

    // ===== UTILITY FUNCTIONS =====

    /// Validate action type
    public fun is_valid_action(action: u8): bool {
        action <= ACTION_BOT
    }

    /// Get action name for display
    public fun get_action_name(action: u8): vector<u8> {
        if (action == ACTION_FAVORITE) {
            b"favorite"
        } else if (action == ACTION_UNFAVORITE) {
            b"unfavorite"
        } else if (action == ACTION_FLAG) {
            b"flag"
        } else if (action == ACTION_BOT) {
            b"bot"
        } else {
            b"unknown"
        }
    }
}
