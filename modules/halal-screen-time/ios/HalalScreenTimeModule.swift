import ExpoModulesCore
import FamilyControls
import ManagedSettings
import SwiftUI

private let store = ManagedSettingsStore()
private let selectionKey = "halal_activity_selection"

public class HalalScreenTimeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("HalalScreenTime")

    AsyncFunction("requestAuthorization") { () async throws -> Bool in
      if #available(iOS 16.0, *) {
        try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
        return AuthorizationCenter.shared.authorizationStatus == .approved
      }
      return false
    }

    Function("getAuthorizationStatus") { () -> String in
      if #available(iOS 16.0, *) {
        switch AuthorizationCenter.shared.authorizationStatus {
        case .notDetermined:
          return "notDetermined"
        case .denied:
          return "denied"
        case .approved:
          return "approved"
        @unknown default:
          return "unknown"
        }
      }
      return "unavailable"
    }

    Function("hasSelection") { () -> Bool in
      return UserDefaults.standard.data(forKey: selectionKey) != nil
    }

    Function("enableBlocking") { () throws -> Bool in
      guard let data = UserDefaults.standard.data(forKey: selectionKey) else {
        return false
      }

      if #available(iOS 16.0, *) {
        let selection = try PropertyListDecoder().decode(
          FamilyActivitySelection.self,
          from: data
        )
        store.shield.applications = selection.applicationTokens
        store.shield.applicationCategories = .specific(selection.categoryTokens)
        store.shield.webDomains = selection.webDomainTokens
      }

      return true
    }

    Function("disableBlocking") { () -> Bool in
      if #available(iOS 16.0, *) {
        store.clearAllSettings()
      } else {
        store.shield.applications = []
        store.shield.applicationCategories = .none
      }
      return true
    }

    Function("showPicker") { () -> Bool in
      if #available(iOS 16.0, *) {
        DispatchQueue.main.async {
          guard let controller = self.appContext?.utilities?.currentViewController() else {
            return
          }

          let picker = HalalFamilyPickerView {
            controller.dismiss(animated: true)
          }

          let hostingController = UIHostingController(rootView: picker)
          hostingController.modalPresentationStyle = .formSheet
          controller.present(hostingController, animated: true)
        }
      }
      return true
    }
  }
}

@available(iOS 16.0, *)
struct HalalFamilyPickerView: View {
  @State private var selection = FamilyActivitySelection()
  let onClose: () -> Void

  init(onClose: @escaping () -> Void) {
    self.onClose = onClose

    if let data = UserDefaults.standard.data(forKey: selectionKey),
       let savedSelection = try? PropertyListDecoder().decode(
        FamilyActivitySelection.self,
        from: data
       ) {
      _selection = State(initialValue: savedSelection)
    }
  }

  var body: some View {
    NavigationView {
      VStack {
        FamilyActivityPicker(selection: $selection)

        Button {
          saveSelection()
          onClose()
        } label: {
          Text("Save blocked apps")
            .font(.headline)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.white)
            .foregroundColor(Color.black)
            .cornerRadius(18)
            .padding(.horizontal, 18)
            .padding(.bottom, 18)
        }
      }
      .background(Color.black)
      .navigationTitle("Choose apps")
      .navigationBarTitleDisplayMode(.inline)
      .toolbar {
        ToolbarItem(placement: .cancellationAction) {
          Button("Close") {
            onClose()
          }
        }
      }
    }
  }

  private func saveSelection() {
    if let data = try? PropertyListEncoder().encode(selection) {
      UserDefaults.standard.set(data, forKey: selectionKey)
    }
  }
}