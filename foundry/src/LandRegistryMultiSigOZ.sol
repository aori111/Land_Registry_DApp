// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Import library OpenZeppelin (Pastikan Anda sudah menginstall @openzeppelin/contracts)
import "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";

/**
 * @title LandRegistryMultiSig
 * @dev Kontrak untuk registrasi dan balik nama sertifikat tanah dengan sistem Multi-Signature.
 * Menggunakan OpenZeppelin AccessControlEnumerable untuk manajemen otoritas.
 */
contract LandRegistryMultiSig is AccessControlEnumerable {

    // ==========================================
    // BAGIAN 1: PENGATURAN MULTI-SIGNATURE & ROLES
    // ==========================================

    // Mendefinisikan peran khusus untuk pihak berwenang
    bytes32 public constant AUTHORITY_ROLE = keccak256("AUTHORITY_ROLE");
    
    uint public requiredConfirmations;

    // ==========================================
    // BAGIAN 2: STRUKTUR DATA SERTIFIKAT TANAH
    // ==========================================

    struct Certificate {
        string nib; 
        string ownerName; 
        string location; 
        uint256 areaSqm; 
        string documentHash; 
        bool isRegistered; 
    }

    mapping(string => Certificate) public certificates;

    mapping(string => bool) public isPendingRegistration;
    mapping(string => bool) public isCidUsed;

    // ==========================================
    // BAGIAN 3: STRUKTUR DATA PERMINTAAN (REQUEST)
    // ==========================================

    enum ActionType { Register, Transfer }

    struct Request {
        ActionType action;
        string nib;
        string newOwnerName;
        string location; 
        uint256 areaSqm; 
        string documentHash;
        bool executed;
        uint confirmationsCount;
    }

    Request[] public requests;
    mapping(uint => mapping(address => bool)) public confirmations;

    // ==========================================
    // EVENTS
    // ==========================================
    event RequestSubmitted(uint indexed requestIndex, ActionType action, string nib);
    event RequestConfirmed(uint indexed requestIndex, address indexed authority);
    event RequestExecuted(uint indexed requestIndex, ActionType action, string nib);
    event CertificateRegistered(string nib, string ownerName);
    event CertificateTransferred(string nib, string oldOwner, string newOwner);

    // ==========================================
    // MODIFIERS
    // ==========================================
    
    // Modifier manual dihapus dan diganti dengan onlyRole(AUTHORITY_ROLE) bawaan OpenZeppelin

    modifier requestExists(uint _requestIndex) {
        require(_requestIndex < requests.length, "Permintaan tidak ditemukan");
        _;
    }

    modifier notExecuted(uint _requestIndex) {
        require(!requests[_requestIndex].executed, "Permintaan sudah dieksekusi");
        _;
    }

    modifier notConfirmed(uint _requestIndex) {
        require(!confirmations[_requestIndex][msg.sender], "Anda sudah menyetujui permintaan ini");
        _;
    }

    // ==========================================
    // FUNGSI UTAMA
    // ==========================================

    constructor(address[] memory _authorities, uint _requiredConfirmations) {
        require(_authorities.length > 0, "Harus ada minimal 1 pihak berwenang");
        require(
            _requiredConfirmations > 0 && _requiredConfirmations <= _authorities.length,
            "Jumlah konfirmasi tidak valid"
        );

        // Memberikan peran admin kepada deployer (opsional, berguna jika ingin menambah otoritas baru nanti)
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        for (uint i = 0; i < _authorities.length; i++) {
            address authority = _authorities[i];
            require(authority != address(0), "Alamat tidak boleh kosong");
            
            // Memberikan hak AUTHORITY_ROLE ke setiap alamat dalam array
            _grantRole(AUTHORITY_ROLE, authority);
        }
        
        requiredConfirmations = _requiredConfirmations;
    }

    // Menggunakan onlyRole() dari OpenZeppelin
    function submitRegistration(
        string memory _nib,
        string memory _ownerName,
        string memory _location,
        uint256 _areaSqm,
        string memory _documentHash
    ) public onlyRole(AUTHORITY_ROLE) {
        require(!certificates[_nib].isRegistered, "NIB sudah terdaftar");
        require(!isCidUsed[_documentHash], "Dokumen (CID) sudah terdaftar");
        require(!isPendingRegistration[_nib], "NIB sedang dalam proses antrean");

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

        confirmRequest(_requestIndex);
        
        isPendingRegistration[_nib] = true;
        isCidUsed[_documentHash] = true;

        emit RequestSubmitted(requests.length - 1, ActionType.Register, _nib);
    }

    function submitTransfer(
        string memory _nib,
        string memory _newOwnerName
    ) public onlyRole(AUTHORITY_ROLE) {
        require(certificates[_nib].isRegistered, "Sertifikat tidak ditemukan");
        require(!isPendingRegistration[_nib], "NIB sedang dalam proses antrean");

        uint _requestIndex = requests.length;

        requests.push(
            Request({
                action: ActionType.Transfer,
                nib: _nib,
                newOwnerName: _newOwnerName,
                location: "", 
                areaSqm: 0, 
                documentHash: "",
                executed: false,
                confirmationsCount: 0
            })
        );

        confirmRequest(_requestIndex);

        isPendingRegistration[_nib] = true;

        emit RequestSubmitted(requests.length - 1, ActionType.Transfer, _nib);
    }

    function confirmRequest(uint _requestIndex)
        public
        onlyRole(AUTHORITY_ROLE)
        requestExists(_requestIndex)
        notExecuted(_requestIndex)
        notConfirmed(_requestIndex)
    {
        Request storage req = requests[_requestIndex];
        confirmations[_requestIndex][msg.sender] = true;
        req.confirmationsCount += 1;

        emit RequestConfirmed(_requestIndex, msg.sender);

        if (req.confirmationsCount >= requiredConfirmations) {
            executeRequest(_requestIndex);
        }
    }

    function executeRequest(uint _requestIndex)
        public
        onlyRole(AUTHORITY_ROLE)
        requestExists(_requestIndex)
        notExecuted(_requestIndex)
    {
        Request storage req = requests[_requestIndex];
        require(req.confirmationsCount >= requiredConfirmations, "Persetujuan belum mencukupi");

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
            isPendingRegistration[req.nib] = false;
            emit CertificateRegistered(req.nib, req.newOwnerName);
        } 
        else if (req.action == ActionType.Transfer) {
            string memory oldOwner = certificates[req.nib].ownerName;
            certificates[req.nib].ownerName = req.newOwnerName;
            isPendingRegistration[req.nib] = false;
            emit CertificateTransferred(req.nib, oldOwner, req.newOwnerName);
        }

        emit RequestExecuted(_requestIndex, req.action, req.nib);
    }

    // ==========================================
    // FUNGSI HELPER (GETTERS)
    // ==========================================

    // Diperbarui untuk menggunakan iterasi bawaan dari AccessControlEnumerable
    function getAuthorities() public view returns (address[] memory) {
        uint256 roleCount = getRoleMemberCount(AUTHORITY_ROLE);
        address[] memory auths = new address[](roleCount);
        
        for (uint256 i = 0; i < roleCount; ++i) {
            auths[i] = getRoleMember(AUTHORITY_ROLE, i);
        }
        
        return auths;
    }

    function getRequestConfirmationsCount(uint _requestIndex) public view returns (uint) {
        return requests[_requestIndex].confirmationsCount;
    }

    function isConfirmed(uint _requestIndex, address _auth) public view returns (bool) {
        return confirmations[_requestIndex][_auth];
    }
}