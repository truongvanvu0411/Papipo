import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  const ApiException({
    required this.statusCode,
    required this.message,
    this.body
  });

  final int statusCode;
  final String message;
  final Object? body;

  @override
  String toString() => 'ApiException($statusCode): $message';
}

class ApiClient {
  ApiClient({String? baseUrl}) : _baseUrl = baseUrl ?? _resolveBaseUrl();

  final String _baseUrl;

  Future<dynamic> get(String path, {String? accessToken}) {
    return _request('GET', path, accessToken: accessToken);
  }

  Future<dynamic> post(
    String path, {
    Object? body,
    String? accessToken
  }) {
    return _request('POST', path, body: body, accessToken: accessToken);
  }

  Future<dynamic> patch(
    String path, {
    Object? body,
    String? accessToken
  }) {
    return _request('PATCH', path, body: body, accessToken: accessToken);
  }

  Future<dynamic> _request(
    String method,
    String path, {
    Object? body,
    String? accessToken
  }) async {
    final uri = Uri.parse('$_baseUrl$path');
    final headers = <String, String>{
      'Content-Type': 'application/json'
    };
    if (accessToken != null) {
      headers['Authorization'] = 'Bearer $accessToken';
    }

    late http.Response response;
    final payload = body == null ? null : jsonEncode(body);

    switch (method) {
      case 'GET':
        response = await http.get(uri, headers: headers);
        break;
      case 'PATCH':
        response = await http.patch(uri, headers: headers, body: payload);
        break;
      default:
        response = await http.post(uri, headers: headers, body: payload);
        break;
    }

    final decodedBody = _decodeBody(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        statusCode: response.statusCode,
        message: _readMessage(decodedBody) ?? 'Request failed',
        body: decodedBody
      );
    }

    return decodedBody;
  }

  dynamic _decodeBody(String body) {
    if (body.trim().isEmpty) {
      return null;
    }
    return jsonDecode(body);
  }

  String? _readMessage(Object? decodedBody) {
    if (decodedBody is Map<String, dynamic>) {
      final message = decodedBody['message'];
      if (message is String) {
        return message;
      }
      if (message is List && message.isNotEmpty) {
        return message.join(', ');
      }
      final error = decodedBody['error'];
      if (error is String) {
        return error;
      }
    }
    return null;
  }

  static String _resolveBaseUrl() {
    const configured = String.fromEnvironment('PAPIPO_API_BASE_URL');
    if (configured.isNotEmpty) {
      return configured;
    }
    if (kIsWeb) {
      return 'http://localhost:4000';
    }
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:4000';
    }
    return 'http://localhost:4000';
  }
}
