// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title LandRegistryMultiSig
 * @dev Kontrak tunggal untuk registrasi tanah dengan fitur Multi-Signature 
 * dan manajemen otoritas internal (PKI-lite).
 */
contract LandRegistryMultiSig {
    // --- MANAJEMEN OTORITAS (PKI INTERNAL) ---
    address public adminPusat;
    mapping(address => bool) public isAuthority;

    // --- PENGATURAN MULTI-SIG ---
    uint256 public requiredConfirmations = 3;

    enum ActionType { Register, Transfer }

    struct Certificate {
        string nib;
        string ownerName;
        string location;
        uint256 areaSqm;
        string documentHash;
        bool isRegistered;
    }

    struct Request {
        ActionType action;
        string nib;
        string newOwnerName;
        string location;
        uint256 areaSqm;
        string documentHash;
        bool executed;
        uint256 confirmationsCount;
    }

    mapping(string => Certificate) public certificates;
    Request[] public requests;
    
    // Mapping konfirmasi: requestIndex => (address => status)
    mapping(uint256 => mapping(address => bool)) public confirmations;

    // --- VALIDASI GANDA (DUPLICATE PREVENTION) ---
    mapping(string => bool) public isPendingRegistration;
    mapping(string => bool) public isCidUsed;

    // --- EVENTS ---
    event RequestSubmitted(uint256 indexed requestIndex, ActionType action, string nib);
    event RequestConfirmed(uint256 indexed requestIndex, address indexed confirmator);
    event RequestExecuted(uint256 indexed requestIndex, ActionType action, string nib);
    event AuthorityAdded(address indexed newAuthority);

    constructor() {
        adminPusat = msg.sender;
        isAuthority[msg.sender] = true; // Deployer otomatis menjadi otoritas pertama
    }

    modifier onlyAuthority() {
        require(isAuthority[msg.sender], "Bukan otoritas BPN yang sah");
        _;
    }

    modifier onlyAdminPusat() {
        require(msg.sender == adminPusat, "Hanya Admin Pusat yang diizinkan");
        _;
    }

    // ==========================================
    // MANAJEMEN OTORITAS
    // ==========================================

    function addAuthority(address _newAuthority) public onlyAdminPusat {
        isAuthority[_newAuthority] = true;
        emit AuthorityAdded(_newAuthority);
    }

    // ==========================================
    // LOGIKA REGISTRASI & MULTI-SIG
    // ==========================================

    function submitRegistration(
        string memory _nib,
        string memory _ownerName,
        string memory _location,
        uint256 _areaSqm,
        string memory _documentHash
    ) public onlyAuthority {
        // Validasi agar tidak ada NIB atau Dokumen (CID) ganda
        require(!certificates[_nib].isRegistered, "NIB sudah terdaftar");
        require(!isPendingRegistration[_nib], "NIB sedang dalam proses antrean");
        require(!isCidUsed[_documentHash], "Dokumen (CID) sudah terdaftar");

        uint _requestIndex = requests.length;

        requests.push(
            Request({
                action: ActionType.Register,
                nib: _nib,
                newOwnerName: _ownerName,
                location: _location,
                areaSqm: _areaSqm,
                documentHash: _documentHash,
                executed: false,
                confirmationsCount: 0
            })
        );

        // Kunci NIB dan CID di tingkat blockchain
        isPendingRegistration[_nib] = true;
        isCidUsed[_documentHash] = true;

        emit RequestSubmitted(_requestIndex, ActionType.Register, _nib);
        
        // Inisiator (msg.sender) otomatis memberikan tanda tangan pertama
        confirmRequest(_requestIndex);
    }

    function confirmRequest(uint256 _requestIndex) public onlyAuthority {
        require(_requestIndex < requests.length, "Request tidak ditemukan");
        Request storage req = requests[_requestIndex];
        
        require(!req.executed, "Request sudah selesai diproses");
        require(!confirmations[_requestIndex][msg.sender], "Anda sudah memberikan tanda tangan");

        confirmations[_requestIndex][msg.sender] = true;
        req.confirmationsCount += 1;

        emit RequestConfirmed(_requestIndex, msg.sender);

        // Jika tanda tangan cukup, eksekusi secara otomatis
        if (req.confirmationsCount >= requiredConfirmations) {
            executeRequest(_requestIndex);
        }
    }

    function executeRequest(uint256 _requestIndex) internal {
        Request storage req = requests[_requestIndex];
        require(!req.executed, "Sudah dieksekusi");
        require(req.confirmationsCount >= requiredConfirmations, "Tanda tangan belum cukup");

        req.executed = true;

        if (req.action == ActionType.Register) {
            certificates[req.nib] = Certificate({
                nib: req.nib,
                ownerName: req.newOwnerName,
                location: req.location,
                areaSqm: req.areaSqm,
                documentHash: req.documentHash,
                isRegistered: true
            });
            
            // Melepaskan status pending agar NIB ini bisa melakukan aksi lain (misal: Transfer) di masa depan
            isPendingRegistration[req.nib] = false;
        }

        emit RequestExecuted(_requestIndex, req.action, req.nib);
    }

    // --- FUNGSI HELPER UNTUK FRONTEND ---
    function getRequestsCount() public view returns (uint) {
        return requests.length;
    }

    function isConfirmed(uint256 _requestIndex, address _auth) public view returns (bool) {
        return confirmations[_requestIndex][_auth];
    }
}