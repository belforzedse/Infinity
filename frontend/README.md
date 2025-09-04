# Infinity Store - Next.js E-commerce Platform

A modern, RTL-first e-commerce platform built with Next.js 13+ (App Router), featuring a robust authentication system and responsive design.

## Features

### Route Navigation

- Interactive route listing on the homepage
- Clear overview of all available application routes
- Route descriptions and easy navigation
- Developer and designer-friendly interface

### Authentication System

- Mobile-responsive login and registration flow
- Two-step registration process with SMS verification
- User existence check before registration/login flow
- RTL-supported UI components
- Password strength indicator
- Atomic design pattern for UI components
- Countdown timer for SMS code resend
- Form validation and error handling

### Product Management

- Comprehensive product creation and editing system
- Support for product categories, tags, and variations
- Image and file upload capabilities
- Size guide management
- Product status management
- Real-time validation and error handling
- Tag and category search functionality
- Conditional media field updates

### Product Listing Page (PLP)

- Dynamic category filtering with API integration
- Real-time availability filtering
- Price range filtering with min/max values
- Size, material, season, gender, and usage filtering options
- URL-based state management for filter persistence
- Loading states for asynchronous data fetching
- Responsive filter UI with dropdown menus

### Product Detail Page (PDP)

- Dynamic image gallery with API integration
- Responsive design with thumbnails and main image view
- Video support for both image and video content
- Product service with TypeScript interfaces for fetching product details by slug
- Fallback images and content when API data is not available
- Enhanced type definitions for API responses and product data models

### Technical Stack

- **Framework**: Next.js 13+ (App Router)
- **State Management**: Jotai
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Font**: Peyda and Inter (for Latin text)
- **Direction**: RTL-first design
- **Notifications**: React Hot Toast
- **API Integration**: Strapi v4

### Form Components

- **FieldRenderer**: A flexible component for rendering different types of form fields
- **TermsField**: A component for managing terms with categories and tags
  - Supports API-based autocomplete with search functionality
  - Allows adding multiple terms with categories
  - Supports keyboard navigation (arrow keys, enter, escape)
  - Displays suggestions in a dropdown with loading state
  - Maintains selected terms as chips with remove functionality
  - Supports category-specific API calls for fetching terms
  - Automatically fetches initial suggestions when a category is selected
  - Clears tags when category changes to maintain data integrity
  - Maintains independent state for each term's search input
  - Shows suggestions only for the active term being edited

### Design Resources

- **Figma Design**: [Infinity Store UI/UX Design](<https://www.figma.com/design/x4y3qlCXNd3ZB6ocY09PPm/infinity-Store-(%D8%B5%D9%81%D8%AD%D9%87-%D8%B3%D8%A7%D8%B2)?node-id=6095-753&t=LjOo8ZcdXXYMvc1Z-1>)

## Project Structure

```
src/
├─ app/
│  ├─ (admin)/          # End-user admin dashboard
│  ├─ (super-admin)/    # Super admin system management
│  ├─ _common/          # Shared components and utilities
│  └─ (public)/         # Main public website
│     └─ auth/          # Authentication pages
├─ components/
│  ├─ Auth/            # Authentication components
│  │  ├─ Form/         # Base form components
│  │  ├─ Login/        # Login related components
│  │  ├─ ForgotPassword/# Password recovery flow
│  │  ├─ Illustration/ # Visual elements
│  │  └─ VerificationInput/ # OTP input component
│  ├─ Kits/            # Atomic design components
│  │  └─ Auth/         # Reusable auth UI components
│  │     ├─ Icons/     # Authentication related icons
│  │     └─ Input/     # Form input components
│  └─ PLP/             # Product Listing Page components
│     └─ List/         # Product list and filter components
│        └─ Filter/    # Filter components for PLP
├─ constants/          # Application constants
│  └─ api.ts           # API endpoints and constants
├─ contexts/           # React contexts
│  └─ AuthContext.tsx  # Authentication context
├─ hooks/              # Custom React hooks
│  └─ useApi.ts        # Hook for API requests
├─ services/           # Service layer
│  ├─ index.ts         # API client and service exports
│  ├─ auth/            # Authentication services
│  │  ├─ index.ts      # Auth service exports
│  │  └─ exists.ts     # User existence check service
│  └─ super-admin/     # Super admin services
│     └─ product/      # Product management services
│        └─ category/  # Category management services
├─ types/              # TypeScript type definitions
│  └─ api.ts           # API-related types
└─ utils/              # Utility functions
```

## Recent Updates

### Shopping Cart with Drawer UI

- **Responsive Cart Drawer**: Implemented a sliding drawer for the shopping cart that works on both mobile and desktop.
- **Local Storage Integration**: Cart items are persisted in localStorage when users are not logged in.
- **Add to Cart Functionality**: Products can be added to cart from the product detail page with quantity selection.
- **Real-time Cart Summary**: Shows real-time count of items in cart and total price.
- **Cart Item Management**: Users can update quantities or remove items directly from the cart drawer.
- **Empty Cart State**: Displays a friendly message and shop link when the cart is empty.
- **Context API**: Used React Context API for global cart state management.
- **Checkout Flow**: Integrated with the existing checkout flow via the cart page.

### Product Detail Page (PDP) Gallery API Integration

- **Dynamic Image Gallery**: Implemented API integration for the PDP gallery component to display product images and videos from the Strapi backend.
- **Media Formatting**: Created a utility function to format API response data into the required gallery assets format.
- **Responsive Design**: Maintained the responsive design of the gallery component with thumbnails and main image view.
- **Video Support**: Preserved support for both image and video content in the gallery.
- **Product Service**: Created a dedicated product service with TypeScript interfaces for fetching product details by slug.
- **Fallback Content**: Added fallback images and content when API data is not available.
- **Type Safety**: Enhanced type definitions for API responses and product data models.

### Product Likes Feature

- **User Favorites**: Implemented a feature allowing users to like/favorite products.
- **Authentication Integration**: Redirects users to login flow if they attempt to like a product while not logged in.
- **Visual Feedback**: Heart icon changes appearance when a product is liked.
- **API Integration**: Connected to the backend API endpoint `/product-likes/toggle` for toggling like status and `/product-likes/user/me` for retrieving user's liked products.
- **State Management**: Created a dedicated `useProductLike` hook for managing product like state and API interactions.
- **Loading States**: Added loading states to prevent multiple clicks and provide visual feedback.

### Dynamic Footer with API Integration

- **API-Driven Footer**: Implemented a dynamic footer that fetches structure and content from the Strapi API.
- **Responsive Design**: Footer maintains consistent layout on both desktop and mobile devices.
- **Fallback Content**: Includes default content to handle API failures gracefully.
- **Section Components**: Created modular section components that consume the API data.
- **Contact Information**: Dynamically displays contact information from the backend.
- **Customer Support**: Shows customer support hours from the API data.
- **Navigation Links**: Footer links are populated from the API for each section.

### Footer Management in Super Admin

- **Footer Edit Page**: Added a dedicated page in the Super Admin section for managing the website footer.
- **Structured Form**: Created a structured form with sections for each footer column, contact information, and customer support text.
- **JSON Editor**: Implemented JSON editing for footer links with helper text for proper formatting.
- **API Integration**: Connected to the Strapi API endpoint for fetching and updating footer content.
- **Sidebar Navigation**: Added a sidebar menu item for quick access to the footer management page.

### Product Listing Page (PLP) Filter Component

- **Dynamic Category Filtering**: The PLP filter component now fetches product categories from the API endpoint `/product-categories` using the API constants.
- **Loading State**: Added loading state to the category filter dropdown to improve user experience during data fetching.
- **URL State Management**: Implemented URL-based state management using `nuqs` for filter persistence across page refreshes.
- **Filter Options**: Enhanced filter options to include size, material, season, gender, and usage filters with search functionality.
- **Availability Filter**: Added an availability filter to show only in-stock products.
- **Price Range Filter**: Implemented a price range filter with min/max values for better product filtering.
- **API Constants Integration**: Utilized the API constants for consistent API endpoint access and authentication.

## Getting Started

1. **Clone the repository**

   ```bash
   git clone [repository-url]
   cd infinity-store
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   NEXT_PUBLIC_API_BASE_URL=https://api.infinity.rgbgroup.ir/api
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Development Guidelines

### Component Structure

- Components follow atomic design principles
- Each component has its own directory
- Reusable UI components are placed in `Kits` directory
- Feature-specific components are organized by feature

### Code Style

- TypeScript for type safety
- RTL-first approach for layouts
- Mobile-first responsive design
- Semantic HTML structure
- Proper component props typing
- Clean code with no unused variables or functions

### State Management

- Jotai for global state management
- React hooks for local state
- Custom hooks for reusable logic

### React Configuration

- StrictMode is disabled in `next.config.ts` to prevent double mounting of components in development
- This helps avoid duplicate API calls and side effects during development

## Authentication Flow

1. **Registration Process**
   - Initial registration with phone number
   - Check if user exists before proceeding
   - SMS verification code input
   - Personal information collection
   - Password creation with strength indicator

2. **Login Process**
   - Phone number input
   - Check if user exists before proceeding
   - Password input with show/hide functionality
   - Error handling and validation

## Contributing

1. Follow the project structure
2. Maintain RTL support
3. Ensure mobile responsiveness
4. Write clean, typed code
5. Test thoroughly before submitting PRs

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

## Learn More

For detailed development documentation, please refer to the [DEVELOPMENT.md](./DEVELOPMENT.md) file.

## License

[License Type] - See LICENSE file for details

## Docker Deployment

### Prerequisites

- Docker installed on your system
- Node.js 20.x or later (for local development)

### Building and Running with Docker

1. **Build the Docker image**

   ```

   ```

## API Integration

The application integrates with a Strapi v4 backend API. Key endpoints include:

- `/api/products` - Fetch products with filtering and pagination
- `/api/product-variations` - Fetch product variations with pricing and discount information
- `/api/product-categories` - Fetch product categories

### API Structure

- **API Client**: Base client for making HTTP requests
- **Service Layer**: Service classes for different API endpoints
- **Types**: TypeScript interfaces for request/response data
- **Constants**: API endpoints and configuration
- **Utilities**: Helper functions for API operations
- **Hooks**: Custom hooks for using API services in components

### Form Components with API Integration

#### Dropdown with API Integration

The application includes a dropdown component that fetches options from an API:

- **Dynamic Options**: Automatically loads options from API endpoints
- **Dependent Dropdowns**: City dropdown depends on selected province
- **Global State Management**: Uses Jotai atoms to track province selection
- **Real-time Updates**: City options update instantly when province changes
- **Fallback UI**: Shows placeholder when no options are available
- **Configurable**: Easy to set up in form configurations
- **Authentication Support**: Includes authentication headers for API requests
- **Service Layer Integration**: Uses the application's apiClient for consistent API access

Example configurations:

```tsx
// Example 1: Basic dropdown with static options
{
  name: "gender",
  type: "dropdown",
  label: "Gender",
  colSpan: 6,
  mobileColSpan: 12,
  options: [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" }
  ],
  placeholder: "Select gender"
}

// Example 2: Province dropdown with API integration
const fetchProvinces = async (searchTerm: string): Promise<Array<{ label: string; value: string }>> => {
  const accessToken = localStorage.getItem("accessToken");
  const response = await apiClient.get("/shipping/province", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = response.data as {
    total: number;
    currentPage: number;
    totalPages: number;
    posts: Array<{
      id: number;
      name: string;
    }>;
  };

  return data.posts.map((province) => ({
    label: province.name,
    value: province.id.toString(),
  }));
};

// Example 3: City dropdown dependent on province selection
const fetchCities = async (
  searchTerm: string,
  formData?: any
): Promise<Array<{ label: string; value: string }>> => {
  const accessToken = localStorage.getItem("accessToken");
  const selectedProvinceId = formData?.province;

  // Only fetch cities if a province is selected
  if (!selectedProvinceId) {
    return [];
  }

  const response = await apiClient.get("/shipping/city", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = response.data;

  // Filter cities by the selected province
  const filteredCities = data.posts.filter(
    (city) => city.province && city.province.id.toString() === selectedProvinceId
  );

  return filteredCities.map((city) => ({
    label: city.name,
    value: city.id.toString(),
  }));
};

// Use in form configuration
{
  name: "province",
  type: "dropdown",
  label: "Province",
  colSpan: 4,
  mobileColSpan: 12,
  options: [],
  fetchOptions: fetchProvinces,
  placeholder: "Select province",
},
{
  name: "city",
  type: "dropdown",
  label: "City",
  colSpan: 4,
  mobileColSpan: 12,
  options: [],
  fetchOptions: fetchCities, // Will receive formData with province value
  placeholder: "Select city",
}
```

##### Province-City Field

A specialized field component for handling province and city selection:

- **Dependent Dropdowns**: City dropdown depends on selected province
- **Automatic Updates**: City options update instantly when province changes
- **Self-Contained Logic**: Manages its own state and API calls internally
- **Optimized Performance**: Uses nested data structure to avoid multiple API calls
- **User-Friendly**: Disables city selection until province is chosen
- **Simplified Configuration**: No need to provide API functions in the configuration

Example configuration:

```tsx
// Example: Province-City field configuration
{
  type: "province-city",
  provinceField: "province",
  cityField: "city",
  label: "Location",
  colSpan: 12,
  mobileColSpan: 12,
  provincePlaceholder: "Select province",
  cityPlaceholder: "Select city"
}
```

#### Implementation Notes

When implementing dependent dropdowns like the province-city field:

1. **Direct Value Binding**: Always bind the select element directly to the prop value rather than using internal state
2. **Immediate Updates**: Update the parent form data immediately when a selection changes
3. **Dependency Management**: Use the updated form data when fetching dependent options
4. **Reset Dependent Fields**: Clear dependent fields when the parent field changes
5. **Disable Until Ready**: Keep dependent fields disabled until parent selection is made
6. **Self-Contained API Logic**: Encapsulate API calls within the component for better reusability
7. **Optimize API Usage**: Use nested data structures when available to minimize API calls

These practices ensure that the form state remains consistent and that the UI accurately reflects the current selection state.

### Authentication Services

The authentication services include:

- **User Existence Check**: Check if a user exists by phone number
- **Login**: Authenticate user with credentials
- **Register**: Register a new user
- **Password Recovery**: Reset password flow

### Authentication Flow

The API authentication flow uses JWT tokens:

1. User enters phone number and system checks if user exists
2. User is directed to login or registration flow based on existence check
3. User logs in with credentials
4. Server returns JWT token
5. Token is stored in localStorage
6. Token is included in subsequent API requests
7. Token expiration is checked on app initialization

### Usage Example

```tsx
import { useApi } from "@/hooks/useApi";
import { authService } from "@/services";

const PhoneNumberForm = () => {
  const { data, loading, error, execute } = useApi(authService.checkUserExists);
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    execute(phoneNumber);
  };

  useEffect(() => {
    if (data) {
      if (data.exists) {
        // Redirect to login flow
        router.push("/auth/login");
      } else {
        // Redirect to registration flow
        router.push("/auth/register");
      }
    }
  }, [data]);

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="tel"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        placeholder="Enter phone number"
      />
      <button type="submit" disabled={loading}>
        {loading ? "Checking..." : "Continue"}
      </button>
      {error && <p className="error">{error.message}</p>}
    </form>
  );
};
```

### Implementation Examples

#### User Forms with Province-City Field

The application includes user forms with a specialized province-city field:

```tsx
// Example: User form with province-city field
{
  type: "province-city",
  provinceField: "province",
  cityField: "city",
  label: "استان و شهر",
  colSpan: 12,
  mobileColSpan: 12,
  fetchProvinces: async (searchTerm) => {
    const response = await apiClient.get("/shipping/province");
    return response.data.posts.map((province) => ({
      label: province.name,
      value: province.id.toString(),
    }));
  },
  fetchCities: async (searchTerm, formData) => {
    const selectedProvinceId = formData?.province;
    if (!selectedProvinceId) return [];

    const response = await apiClient.get("/shipping/city");
    return response.data.posts
      .filter(city => city.province.id.toString() === selectedProvinceId)
      .map(city => ({
        label: city.name,
        value: city.id.toString(),
      }));
  },
  provincePlaceholder: "انتخاب استان",
  cityPlaceholder: "انتخاب شهر"
}
```

This approach offers several advantages:

- **Simplified Configuration**: One field handles both province and city selection
- **Encapsulated Logic**: All dependency logic is contained within the component
- **Improved User Experience**: City dropdown is automatically disabled until a province is selected
- **Automatic Updates**: City options update immediately when province changes
- **Reduced Boilerplate**: No need for separate field definitions and positioning

#### Implementation Notes

When implementing dependent dropdowns like the province-city field:

1. **Direct Value Binding**: Always bind the select element directly to the prop value rather than using internal state
2. **Immediate Updates**: Update the parent form data immediately when a selection changes
3. **Dependency Management**: Use the updated form data when fetching dependent options
4. **Reset Dependent Fields**: Clear dependent fields when the parent field changes
5. **Disable Until Ready**: Keep dependent fields disabled until parent selection is made

These practices ensure that the form state remains consistent and that the UI accurately reflects the current selection state.

## Product Size Helper

The application includes a flexible product size helper feature that allows for dynamic size guides:

- **Dynamic Columns**: Add and remove measurement columns as needed
- **Infinite Rows**: Add as many size rows as required
- **Direct Cell Editing**: Edit cells directly in the table view
- **Persistent Data**: Size guides are saved to the database and retrieved on page load
- **Responsive Design**: Works well on all device sizes
- **RTL Support**: Fully supports right-to-left layout
- **Validation**: Ensures all required fields are filled before saving

### Size Helper Components

- **SizeGuideEditor**: Component for creating and editing size guides
  - Add/remove columns with custom titles
  - Add/remove rows for different sizes
  - Direct cell editing
  - Validation before saving
- **SizeTable**: Component for displaying size guides
  - Read-only view of size data
  - Responsive table layout
  - Direct cell editing in view mode

### Usage Example

```tsx
// In a product edit page
<Sizes productId={productId} />
```

## API Integration Notes

### Product API

The product details endpoint has been updated to use specific populate parameters for better data retrieval:

```
/api/products/:id?populate[0]=CoverImage&populate[1]=Media&populate[2]=product_main_category&populate[3]=product_reviews&populate[4]=product_tags&populate[5]=product_variations&populate[6]=product_variations.product_stock&populate[7]=product_variations.product_variation_color&populate[8]=product_variations.product_variation_size&populate[9]=product_variations.product_variation_model&populate[10]=product_other_categories
```

This provides access to:

- Product basic information (title, description, etc.)
- Product images and media
- Main category
- Product reviews
- Product tags
- Product variations with:
  - Stock information
  - Color options (with color codes)
  - Size options
  - Model variants
- Other categories

### Product Variation Helpers

The application includes several helper functions for working with product variations:

- **getDefaultProductVariation**: Selects the first available product variation with stock, falling back to any published variation
- **getProductColors**: Extracts all unique color options from product variations
- **getProductSizes**: Gets all available sizes, optionally filtered by a specific color
- **getProductModels**: Extracts all unique model options from variations
- **findProductVariation**: Finds a specific variation by color, size, and model IDs

These helpers make it easy to implement features like:

- Showing default product information based on available variations
- Displaying color swatches with accurate availability
- Building dynamic size selectors that update based on color selection
- Finding the exact product variation when a user selects specific attributes

## Development

To start the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Building

```bash
npm run build
# or
yarn build
```
