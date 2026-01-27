import React, { Component, ErrorInfo, ReactNode } from "react";
import { Text, View, Button, StyleSheet, ScrollView } from "react-native";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleResetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    // Here you might want to trigger a reload or navigation to a safe screen
    // For now, we just reset the state and try to re-render children.
  };

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! Something went wrong.</Text>
          <Text style={styles.subtitle}>
            An unexpected error occurred. Please try again.
          </Text>

          {__DEV__ && this.state.error && (
            <ScrollView style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Error Details (Dev Mode Only)</Text>
              <Text style={styles.errorText}>{this.state.error.toString()}</Text>
              {this.state.errorInfo && (
                <Text style={styles.errorText}>
                  {this.state.errorInfo.componentStack}
                </Text>
              )}
            </ScrollView>
          )}

          <Button title="Try Again" onPress={this.handleResetError} color="#FF69B4" />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFF0F5", // Light pink background
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#D81B60", // Darker pink
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  errorContainer: {
    maxHeight: "50%",
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    padding: 15,
    marginVertical: 20,
    width: "100%",
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#C62828",
    marginBottom: 10,
  },
  errorText: {
    fontSize: 12,
    color: "#D32F2F",
    fontFamily: "monospace", // Or your preferred mono font
  },
});

export default ErrorBoundary;
