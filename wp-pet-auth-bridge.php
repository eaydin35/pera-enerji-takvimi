<?php
/**
 * Plugin Name: PET Auth Bridge
 * Description: Retrieves WP User ID by verifying email and password for the Pera Enerji Takvimi mobile app.
 * Version: 1.0.0
 * Author: Pera App
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('rest_api_init', function () {
    register_rest_route('pet/v1', '/auth', array(
        'methods' => 'POST',
        'callback' => 'pet_auth_bridge_login',
        'permission_callback' => '__return_true'
    ));
});

function pet_auth_bridge_login($request) {
    $parameters = $request->get_json_params();
    $email = sanitize_email($parameters['email']);
    $password = $parameters['password'];

    if (empty($email) || empty($password)) {
        return new WP_Error('missing_credentials', 'Email and password are required', array('status' => 400));
    }

    $user = get_user_by('email', $email);

    if (!$user) {
        return new WP_Error('invalid_credentials', 'Geçersiz e-posta veya şifre.', array('status' => 401));
    }

    if (!wp_check_password($password, $user->user_pass, $user->ID)) {
        return new WP_Error('invalid_credentials', 'Geçersiz e-posta veya şifre.', array('status' => 401));
    }

    // Generate a short-lived token
    $token = wp_generate_password(32, false);
    set_transient('pet_auth_token_' . $token, $user->ID, 15 * MINUTE_IN_SECONDS);

    return rest_ensure_response(array(
        'wp_user_id' => $user->ID,
        'email' => $user->user_email,
        'token' => $token,
        'first_name' => $user->first_name,
        'last_name' => $user->last_name,
    ));
}
