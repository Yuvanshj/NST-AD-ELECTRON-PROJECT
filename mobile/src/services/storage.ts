import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'mahasetu_auth_token';
const USER_KEY = 'mahasetu_user_data';

// In-memory fallback if SecureStore is unavailable
let memoryStore: Record<string, string> = {};

export async function saveToken(token: string): Promise<void> {
  try {
    if (Platform.OS !== 'web' && SecureStore?.setItemAsync) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      memoryStore[TOKEN_KEY] = token;
    }
  } catch (e) {
    memoryStore[TOKEN_KEY] = token;
  }
}

export async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS !== 'web' && SecureStore?.getItemAsync) {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    }
    return memoryStore[TOKEN_KEY] || null;
  } catch (e) {
    return memoryStore[TOKEN_KEY] || null;
  }
}

export async function removeToken(): Promise<void> {
  try {
    if (Platform.OS !== 'web' && SecureStore?.deleteItemAsync) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
    delete memoryStore[TOKEN_KEY];
  } catch (e) {
    delete memoryStore[TOKEN_KEY];
  }
}

export async function saveUser(user: any): Promise<void> {
  const json = JSON.stringify(user);
  try {
    if (Platform.OS !== 'web' && SecureStore?.setItemAsync) {
      await SecureStore.setItemAsync(USER_KEY, json);
    } else {
      memoryStore[USER_KEY] = json;
    }
  } catch (e) {
    memoryStore[USER_KEY] = json;
  }
}

export async function getUser(): Promise<any | null> {
  try {
    let json: string | null = null;
    if (Platform.OS !== 'web' && SecureStore?.getItemAsync) {
      json = await SecureStore.getItemAsync(USER_KEY);
    } else {
      json = memoryStore[USER_KEY] || null;
    }
    return json ? JSON.parse(json) : null;
  } catch (e) {
    return null;
  }
}

export async function clearAll(): Promise<void> {
  await removeToken();
  try {
    if (Platform.OS !== 'web' && SecureStore?.deleteItemAsync) {
      await SecureStore.deleteItemAsync(USER_KEY);
    }
    delete memoryStore[USER_KEY];
  } catch (e) {}
}
