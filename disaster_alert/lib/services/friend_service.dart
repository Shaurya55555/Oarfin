import 'dart:convert';
import 'package:flutter/material.dart';
import '../models/friend_model.dart';
import 'auth_service.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'api_service.dart';

class FriendService extends ChangeNotifier {
  final AuthService _authService;
  final ApiService _apiService;

  List<FriendModel> _friends = [];
  List<FriendModel> _pendingRequests = [];
  bool _isLoading = false;
  String? _errorMessage;

  // Getters
  List<FriendModel> get friends => _friends;
  List<FriendModel> get pendingRequests => _pendingRequests;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Constructor with dependency injection
  FriendService(this._authService, this._apiService) {
    print('🔍 FriendService: Initializing');
    // Listen to auth changes
    _authService.addListener(_onAuthChanged);

    // Initial load
    if (_authService.currentUser != null &&
        !_authService.currentUser!.isAnonymous) {
      print(
          '🔍 FriendService: User authenticated at initialization, loading friends');
      _loadFriends();
    } else {
      print('🔍 FriendService: No authenticated user at initialization');
    }
  }

  // Clean up listeners when disposed
  @override
  void dispose() {
    print('🔍 FriendService: Disposing and removing auth listener');
    _authService.removeListener(_onAuthChanged);
    super.dispose();
  }

  // Handle auth changes
  void _onAuthChanged() {
    print(
        '🔍 FriendService: Auth state changed. User: ${_authService.currentUser?.uid ?? "none"}');
    if (_authService.currentUser != null &&
        !_authService.currentUser!.isAnonymous) {
      print('🔍 FriendService: User authenticated, loading friends');
      _loadFriends();
    } else {
      // Clear friends if logged out or anonymous
      print('🔍 FriendService: User logged out or anonymous, clearing friends');
      _friends = [];
      _pendingRequests = [];
      notifyListeners();
    }
  }

  // Load friends from API
  Future<void> _loadFriends() async {
    if (_authService.currentUser == null ||
        _authService.currentUser!.isAnonymous) {
      print('🔍 FriendService: Skipping _loadFriends - no authenticated user');
      return;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // Get accepted friends
      print('🔍 FriendService: Fetching accepted friends');
      final uid = _authService.currentUser?.uid;
      print('🔍 FriendService: Current user ID: $uid');

      final friendsResponse = await _apiService.get('/api/friends',
          queryParams: {'status': 'accepted', 'userID': uid});

      print(
          '🔍 FriendService: Accepted friends response status: ${friendsResponse.statusCode}');
      print(
          '🔍 FriendService: Accepted friends response body: ${friendsResponse.body}');

      if (friendsResponse.statusCode == 200) {
        final List<dynamic> data = json.decode(friendsResponse.body);
        print('🔍 FriendService: Received ${data.length} accepted friends');

        // Debug each friend entry
        for (var i = 0; i < data.length; i++) {
          print('🔍 FriendService: Friend data $i: ${json.encode(data[i])}');
        }

        _friends = data.map((json) {
          try {
            final model = FriendModel.fromJson(json);
            print(
                '🔍 FriendService: Parsed friend: ${model.displayName} (${model.userId})');
            return model;
          } catch (e, stackTrace) {
            print('🔍 FriendService: Error parsing friend: $e');
            print('🔍 FriendService: Friend JSON: ${json.toString()}');
            print('🔍 FriendService: Stack trace: $stackTrace');
            // Create a placeholder friend to avoid null issues
            return FriendModel(
              id: 'error-${DateTime.now().millisecondsSinceEpoch}',
              userId: 'error-user',
              displayName: 'Error Parsing Friend',
              email: 'error@example.com',
              status: FriendStatus.accepted,
            );
          }
        }).toList();

        print(
            '🔍 FriendService: Successfully parsed ${_friends.length} friend models');
      } else {
        print(
            '🔍 FriendService: Error fetching accepted friends - Status ${friendsResponse.statusCode}');
        _apiService.handleError(friendsResponse);
      }

      // Get pending requests
      print('🔍 FriendService: Fetching pending friend requests');
      final pendingResponse = await _apiService.get('/api/friends',
          queryParams: {
            'status': 'pending',
            'userID': _authService.currentUser?.uid
          });

      print(
          '🔍 FriendService: Pending requests response status: ${pendingResponse.statusCode}');
      print(
          '🔍 FriendService: Pending requests response body: ${pendingResponse.body}');

      if (pendingResponse.statusCode == 200) {
        final List<dynamic> data = json.decode(pendingResponse.body);
        print('🔍 FriendService: Received ${data.length} pending requests');

        // Debug each pending request entry
        for (var i = 0; i < data.length; i++) {
          print(
              '🔍 FriendService: Pending request data $i: ${json.encode(data[i])}');
        }

        _pendingRequests = data.map((json) {
          try {
            final model = FriendModel.fromJson(json);
            print(
                '🔍 FriendService: Parsed pending request: ${model.displayName} (${model.id}), isRequestor: ${model.isRequestor}');
            return model;
          } catch (e, stackTrace) {
            print('🔍 FriendService: Error parsing pending request: $e');
            print('🔍 FriendService: Request JSON: ${json.toString()}');
            print('🔍 FriendService: Stack trace: $stackTrace');
            // Create a placeholder request to avoid null issues
            return FriendModel(
              id: 'error-${DateTime.now().millisecondsSinceEpoch}',
              userId: 'error-user',
              displayName: 'Error Parsing Request',
              email: 'error@example.com',
              status: FriendStatus.pending,
            );
          }
        }).toList();

        print(
            '🔍 FriendService: Successfully parsed ${_pendingRequests.length} pending request models');

        // Additional debugging for pending requests
        print('🔍 FriendService: PENDING REQUESTS DETAILS:');
        _pendingRequests.forEach((request) {
          print('  - ID: ${request.id}');
          print('    User ID: ${request.userId}');
          print('    Requestor ID: ${request.requestorID}');
          print('    Is Requestor: ${request.isRequestor}');
          print('    Name: ${request.displayName}');
          print('    Email: ${request.email}');
          print('    Status: ${request.status}');
        });
      } else {
        print(
            '🔍 FriendService: Error fetching pending requests - Status ${pendingResponse.statusCode}');
        _apiService.handleError(pendingResponse);
      }

      _isLoading = false;
      print('🔍 FriendService: Finished loading - calling notifyListeners()');
      print(
          '🔍 FriendService: Final state - ${_friends.length} friends, ${_pendingRequests.length} pending requests');
      notifyListeners();
    } catch (e, stackTrace) {
      _errorMessage = 'Failed to load friends: ${e.toString()}';
      _isLoading = false;
      print('🔍 FriendService: Exception in _loadFriends: $_errorMessage');
      print('🔍 FriendService: Stack trace: $stackTrace');
      notifyListeners();
    }
  }

  // Send friend request
  Future<bool> sendFriendRequest(String email) async {
    print('🔍 FriendService: Attempting to send friend request to $email');
    if (_authService.currentUser == null ||
        _authService.currentUser!.isAnonymous) {
      _errorMessage = 'You need to be logged in to add friends';
      print('🔍 FriendService: Cannot send request - no authenticated user');
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final userID = _authService.currentUser!.uid;
      print(
          '🔍 FriendService: Sending friend request from user $userID to $email');

      final response = await _apiService.post(
        '/api/friends/request',
        data: {'email': email, 'userID': userID},
      );

      print(
          '🔍 FriendService: Friend request API response status: ${response.statusCode}');
      print(
          '🔍 FriendService: Friend request API response body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        print('🔍 FriendService: Friend request to $email sent successfully');
        // Reload friends to get updated list
        await _loadFriends();
        return true;
      } else {
        final errorData = json.decode(response.body);
        _errorMessage = errorData['message'] ??
            errorData['error'] ??
            'Failed to send friend request';
        print(
            '🔍 FriendService: Failed to send friend request: $_errorMessage');
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e, stackTrace) {
      _errorMessage = 'Failed to send friend request: ${e.toString()}';
      print(
          '🔍 FriendService: Exception sending friend request: $_errorMessage');
      print('🔍 FriendService: Stack trace: $stackTrace');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Accept friend request
  Future<bool> acceptFriendRequest(String requestId) async {
    print('🔍 FriendService: Attempting to accept friend request $requestId');
    if (_authService.currentUser == null ||
        _authService.currentUser!.isAnonymous) {
      print('🔍 FriendService: Cannot accept request - no authenticated user');
      return false;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      print('🔍 FriendService: Sending accept request for ID $requestId');
      final response = await _apiService.put(
        '/api/friends/respond',
        data: {
          'requestId': requestId,
          'status': 'accept',
          'userID':
              _authService.currentUser!.uid, // Add user ID for extra security
        },
      );

      print(
          '🔍 FriendService: Accept request API response status: ${response.statusCode}');
      print(
          '🔍 FriendService: Accept request API response body: ${response.body}');

      if (response.statusCode == 200) {
        print(
            '🔍 FriendService: Friend request $requestId accepted successfully');
        // Reload friends to get updated list
        await _loadFriends();
        return true;
      } else {
        Map<String, dynamic> errorData;
        try {
          errorData = json.decode(response.body);
        } catch (e) {
          errorData = {'message': 'Invalid response format'};
        }

        _errorMessage = errorData['message'] ??
            errorData['error'] ??
            'Failed to accept friend request';
        print('🔍 FriendService: Failed to accept request: $_errorMessage');
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e, stackTrace) {
      _errorMessage = 'Failed to accept friend request: ${e.toString()}';
      print(
          '🔍 FriendService: Exception accepting friend request: $_errorMessage');
      print('🔍 FriendService: Stack trace: $stackTrace');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Reject friend request
  Future<bool> rejectFriendRequest(String requestId) async {
    print('🔍 FriendService: Attempting to reject friend request $requestId');
    if (_authService.currentUser == null ||
        _authService.currentUser!.isAnonymous) {
      print('🔍 FriendService: Cannot reject request - no authenticated user');
      return false;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      print('🔍 FriendService: Sending reject request for ID $requestId');
      final response = await _apiService.put(
        '/api/friends/respond',
        data: {
          'requestId': requestId,
          'status': 'reject',
          'userID':
              _authService.currentUser!.uid, // Add user ID for extra security
        },
      );

      print(
          '🔍 FriendService: Reject request API response status: ${response.statusCode}');
      print(
          '🔍 FriendService: Reject request API response body: ${response.body}');

      if (response.statusCode == 200) {
        print(
            '🔍 FriendService: Friend request $requestId rejected successfully');
        // Reload friends to get updated list
        await _loadFriends();
        return true;
      } else {
        Map<String, dynamic> errorData;
        try {
          errorData = json.decode(response.body);
        } catch (e) {
          errorData = {'message': 'Invalid response format'};
        }

        _errorMessage = errorData['message'] ??
            errorData['error'] ??
            'Failed to reject friend request';
        print('🔍 FriendService: Failed to reject request: $_errorMessage');
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e, stackTrace) {
      _errorMessage = 'Failed to reject friend request: ${e.toString()}';
      print(
          '🔍 FriendService: Exception rejecting friend request: $_errorMessage');
      print('🔍 FriendService: Stack trace: $stackTrace');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Remove friend
  Future<bool> removeFriend(String friendId) async {
    print('🔍 FriendService: Attempting to remove friend $friendId');
    if (_authService.currentUser == null ||
        _authService.currentUser!.isAnonymous) {
      print('🔍 FriendService: Cannot remove friend - no authenticated user');
      return false;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      print('🔍 FriendService: Sending remove request for friend $friendId');
      final response = await _apiService.delete('/api/friends/$friendId');

      print(
          '🔍 FriendService: Remove friend API response status: ${response.statusCode}');
      print(
          '🔍 FriendService: Remove friend API response body: ${response.body}');

      if (response.statusCode == 200) {
        // Update local list
        print(
            '🔍 FriendService: Removing friend with userId $friendId from local list');
        final beforeCount = _friends.length;
        _friends.removeWhere((friend) => friend.userId == friendId);
        final afterCount = _friends.length;

        print(
            '🔍 FriendService: Removed ${beforeCount - afterCount} entries from friends list');

        if (beforeCount == afterCount) {
          // If nothing was removed by userId, try by id
          print(
              '🔍 FriendService: No friend found with userId $friendId, trying by id');
          final beforeCount2 = _friends.length;
          _friends.removeWhere((friend) => friend.id == friendId);
          final afterCount2 = _friends.length;
          print(
              '🔍 FriendService: Removed ${beforeCount2 - afterCount2} entries by id');
        }

        print('🔍 FriendService: Friend $friendId removed successfully');
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        Map<String, dynamic> errorData;
        try {
          errorData = json.decode(response.body);
        } catch (e) {
          errorData = {'message': 'Invalid response format'};
        }

        _errorMessage = errorData['message'] ??
            errorData['error'] ??
            'Failed to remove friend';
        print('🔍 FriendService: Failed to remove friend: $_errorMessage');
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e, stackTrace) {
      _errorMessage = 'Failed to remove friend: ${e.toString()}';
      print('🔍 FriendService: Exception removing friend: $_errorMessage');
      print('🔍 FriendService: Stack trace: $stackTrace');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Update friend location
  Future<bool> updateFriendLocation(
    String friendId,
    double latitude,
    double longitude,
  ) async {
    print(
        '🔍 FriendService: Updating location for friend $friendId: lat=$latitude, long=$longitude');
    if (_authService.currentUser == null ||
        _authService.currentUser!.isAnonymous) {
      print('🔍 FriendService: Cannot update location - no authenticated user');
      return false;
    }

    try {
      // Update location via API
      print('🔍 FriendService: Sending location update for friend $friendId');
      final response = await _apiService.put(
        '/api/friends/${friendId}/location',
        data: {
          'latitude': latitude,
          'longitude': longitude,
          'userID':
              _authService.currentUser!.uid, // Add user ID for extra security
        },
      );

      print(
          '🔍 FriendService: Update location API response status: ${response.statusCode}');
      print(
          '🔍 FriendService: Update location API response body: ${response.body}');

      if (response.statusCode == 200) {
        // Update local data
        final index =
            _friends.indexWhere((friend) => friend.userId == friendId);
        if (index >= 0) {
          print(
              '🔍 FriendService: Updating local friend location data for index $index');
          _friends[index] = _friends[index].copyWith(
            latitude: latitude,
            longitude: longitude,
            lastLocationUpdate: DateTime.now(),
          );
          notifyListeners();
        } else {
          print('🔍 FriendService: Friend $friendId not found in local data');
        }
        return true;
      } else {
        print(
            '🔍 FriendService: Failed to update location - API error ${response.statusCode}');
        return false;
      }
    } catch (e, stackTrace) {
      print('🔍 FriendService: Exception updating location: $e');
      print('🔍 FriendService: Stack trace: $stackTrace');
      return false;
    }
  }

  Future<void> refreshFriends() async {
    print('🔍 FriendService: Manual refresh of friends requested');
    dumpState(); // Dump current state before refresh
    await _loadFriends();
    print('🔍 FriendService: Manual refresh completed');
    dumpState(); // Dump state after refresh
  }

  // Get friends with active alerts
  List<FriendModel> getFriendsWithAlerts() {
    final alertFriends =
        _friends.where((friend) => friend.hasActiveAlerts).toList();
    print(
        '🔍 FriendService: Found ${alertFriends.length} friends with active alerts');
    return alertFriends;
  }

  // Get friend by ID
  FriendModel? getFriendById(String friendId) {
    print('🔍 FriendService: Looking up friend with ID $friendId');
    try {
      final friend = _friends.firstWhere((friend) => friend.userId == friendId);
      print('🔍 FriendService: Found friend $friendId: ${friend.displayName}');
      return friend;
    } catch (e) {
      print(
          '🔍 FriendService: Friend $friendId not found by userId, trying by id');
      try {
        final friend = _friends.firstWhere((friend) => friend.id == friendId);
        print(
            '🔍 FriendService: Found friend with id $friendId: ${friend.displayName}');
        return friend;
      } catch (e) {
        print(
            '🔍 FriendService: Friend $friendId not found by either userId or id');
        return null;
      }
    }
  }

  // Debug helper: Dump current state
  void dumpState() {
    print('======= FRIEND SERVICE STATE DUMP =======');
    print('Is loading: $_isLoading');
    print('Error message: $_errorMessage');
    print('User authenticated: ${_authService.currentUser != null}');
    if (_authService.currentUser != null) {
      print('User ID: ${_authService.currentUser!.uid}');
    }
    print('Friends count: ${_friends.length}');
    for (var i = 0; i < _friends.length; i++) {
      print('Friend $i: ${_friends[i].displayName} (${_friends[i].userId})');
    }
    print('Pending requests count: ${_pendingRequests.length}');
    for (var i = 0; i < _pendingRequests.length; i++) {
      print(
          'Pending $i: ${_pendingRequests[i].displayName} (${_pendingRequests[i].id})');
      print('  Status: ${_pendingRequests[i].status}');
      print('  IsRequestor: ${_pendingRequests[i].isRequestor}');
      print('  RequestorID: ${_pendingRequests[i].requestorID}');
    }
    print('========================================');
  }
}
