# Technical Debt Documentation

## Direct Dio Instances

### Issue
Some files create direct `Dio()` instances instead of using the shared `ApiClient` instance, which can lead to inconsistent configuration and makes it harder to maintain network settings centrally.

### Affected Files

1. **`lib/features/authentication/presentation/bloc/auth_bloc.dart`**
   - Lines: 59, 111, 184, 242
   - Usage: Creating Dio instances for fetching user profile data after login/signup and refreshing user data
   - Impact: Low - These are one-off requests that need specific token handling
   - Recommendation: Consider using a shared ApiClient instance or creating a helper method for authenticated requests

2. **`lib/features/dashboard/presentation/pages/settings_page.dart`**
   - Line: 146
   - Usage: Creating Dio instance for updating user profile (name and profile picture)
   - Impact: Low - This is a specific multipart form data request
   - Recommendation: Consider using the auth repository or a dedicated profile service

### Why This Exists
These instances were likely created for convenience when implementing specific features that required direct control over the request (e.g., custom headers, form data handling). The shared `ApiClient` uses `Constants.baseUrl` and includes `TokenInterceptor`, which should be sufficient for most cases.

### Future Improvement
Consider refactoring to:
1. Create a `ProfileService` or extend the auth repository to handle profile updates
2. Use a shared `ApiClient` instance from dependency injection
3. Create helper methods for authenticated requests that reuse `ApiClient` configuration

### Priority
Low - Current implementation works correctly and endpoints are properly configured. This is an optional refactoring for code consistency.

