/**
 * Service Container - Dependency Injection
 * Implements IoC (Inversion of Control) for clean architecture
 *
 * @module core
 * @since 0.3.0
 */

/**
 * Factory function type for creating service instances
 */
type ServiceFactory<T> = () => T;

/**
 * Service Container for dependency injection
 * Manages service lifecycle and dependencies
 */
export class ServiceContainer {
  private services = new Map<string, ServiceFactory<any>>();
  private singletons = new Map<string, any>();

  /**
   * Register a transient service (new instance each time)
   * @param name - Service identifier
   * @param factory - Function that creates the service
   */
  register<T>(name: string, factory: ServiceFactory<T>): void {
    this.services.set(name, factory);
  }

  /**
   * Register a singleton service (single instance)
   * @param name - Service identifier
   * @param factory - Function that creates the service
   */
  singleton<T>(name: string, factory: ServiceFactory<T>): void {
    this.services.set(name, factory);
    this.singletons.set(name, null); // Mark as singleton
  }

  /**
   * Resolve a service instance
   * @param name - Service identifier
   * @returns Service instance
   */
  resolve<T>(name: string): T {
    // Check if it's a singleton and already instantiated
    if (this.singletons.has(name)) {
      let instance = this.singletons.get(name);
      if (instance === null) {
        // First time - create and cache
        const factory = this.services.get(name);
        if (!factory) {
          throw new Error(`Service not registered: ${name}`);
        }
        instance = factory();
        this.singletons.set(name, instance);
      }
      return instance;
    }

    // Transient service - create new instance
    const factory = this.services.get(name);
    if (!factory) {
      throw new Error(`Service not registered: ${name}`);
    }

    return factory();
  }

  /**
   * Check if a service is registered
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.singletons.clear();
  }

  /**
   * Get all registered service names
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }
}

/**
 * Global service container instance
 * Can be imported and used across the application
 */
export const container = new ServiceContainer();
