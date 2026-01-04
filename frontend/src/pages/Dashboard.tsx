import { useState } from "react";
import { DynamicDialog } from "@/components/dynamic-dialog/DynamicDialog";
import { DynamicAlertDialog } from "@/components/dynamic-alert-dialog/DynamicAlertDialog";
import { DynamicForm } from "@/components/dynamic-form/DynamicForm";
import { DynamicTabs } from "@/components/dynamic-tabs/DynamicTabs";
import { DynamicSheet } from "@/components/dynamic-sheet/DynamicSheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Settings,
  User,
  MessageSquare,
  FileText,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Layers,
  MousePointerClick,
  PanelRight,
  ArrowRight,
  Lock,
  Activity,
  Briefcase,
  Bell,
} from "lucide-react";

import type { TabItem } from "@/interface/DynamicTabs";
import {
  authFormConfig,
  feedbackFormConfig,
  caseEntryFormConfig,
  formConfig,
} from "@/config/dynamic-form/test";

function Dashboard() {
  // --- Global State ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  // --- Dialog States ---
  const [basicDialogOpen, setBasicDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // --- AlertDialog States ---
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [logoutAlertOpen, setLogoutAlertOpen] = useState(false);
  const [successAlertOpen, setSuccessAlertOpen] = useState(false);

  // --- Sheet States ---
  const [rightSheetOpen, setRightSheetOpen] = useState(false);
  const [leftSheetOpen, setLeftSheetOpen] = useState(false);
  const [formSheetOpen, setFormSheetOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // --- Dynamic Form Config State ---
  const [activeFormConfig, setActiveFormConfig] = useState(authFormConfig);
  const [activeTitle, setActiveTitle] = useState("");
  const [activeDesc, setActiveDesc] = useState("");

  // --- Helper to launch forms ---
  const launchForm = (
    type: "dialog" | "sheet",
    config: typeof authFormConfig,
    title: string,
    desc: string
  ) => {
    setActiveFormConfig(config);
    setActiveTitle(title);
    setActiveDesc(desc);
    if (type === "dialog") setDialogOpen(true);
    if (type === "sheet") setSheetOpen(true);
  };

  // --- Form Submit Handler ---
  const handleFormSubmit = async (data: any, isValid: boolean) => {
    if (!isValid) return;

    setIsSubmitting(true);
    // Simulate Network Request
    await new Promise(resolve => setTimeout(resolve, 1200));
    setIsSubmitting(false);

    // Close containers
    setDialogOpen(false);
    setSheetOpen(false);
    setFormDialogOpen(false);
    setFormSheetOpen(false);

    // Show Success Alert with Data
    setSubmittedData(data);
    setSuccessAlertOpen(true);
  };

  // --- Action Handlers ---
  const handleConfirmAction = () => {
    alert("Action confirmed!");
    setConfirmDialogOpen(false);
  };

  const handleDelete = () => {
    alert("Item deleted successfully!");
    setDeleteAlertOpen(false);
  };

  const handleLogout = () => {
    alert("Logged out successfully!");
    setLogoutAlertOpen(false);
  };

  // --- Tab Content Definitions ---
  const mainTabs: TabItem[] = [
    {
      id: "summary",
      label: "Summary",
      content: (
        <div className='p-8 border rounded-md bg-muted/20 border-dashed flex flex-col items-center justify-center text-center animate-in fade-in-50'>
          <Activity className='h-10 w-10 text-muted-foreground mb-4 opacity-50' />
          <h3 className='text-lg font-semibold'>Real-time Overview</h3>
          <p className='text-sm text-muted-foreground max-w-sm'>
            This component renders content dynamically based on the active tab
            state.
          </p>
        </div>
      ),
    },
    {
      id: "Tasks",
      label: "Tasks",
      content: (
        <div className='p-8 border rounded-md bg-muted/20 border-dashed flex flex-col items-center justify-center text-center animate-in fade-in-50'>
          <Activity className='h-10 w-10 text-muted-foreground mb-4 opacity-50' />
          <h3 className='text-lg font-semibold'>Real-time Overview</h3>
          <p className='text-sm text-muted-foreground max-w-sm'>
            This component renders content dynamically based on the active tab
            state.
          </p>
        </div>
      ),
    },
    {
      id: "insights",
      label: "Analytics",
      content: (
        <div className='p-8 border rounded-md bg-muted/20 border-dashed flex flex-col items-center justify-center text-center animate-in fade-in-50'>
          <Layers className='h-10 w-10 text-muted-foreground mb-4 opacity-50' />
          <h3 className='text-lg font-semibold'>Data Insights</h3>
          <p className='text-sm text-muted-foreground'>
            Visualizations and chart components would mount here.
          </p>
        </div>
      ),
    },
  ];

  const basicTabs: TabItem[] = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Overview Tab</h3>
          <p className='text-muted-foreground'>
            This is the overview content. You can put any React component here.
          </p>
        </div>
      ),
    },
    {
      id: "analytics",
      label: "Analytics",
      content: (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Analytics Tab</h3>
          <p className='text-muted-foreground'>
            Analytics data and charts would go here.
          </p>
        </div>
      ),
    },
    {
      id: "reports",
      label: "Reports",
      content: (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Reports Tab</h3>
          <p className='text-muted-foreground'>
            Generate and view reports in this section.
          </p>
        </div>
      ),
    },
  ];

  const iconTabs: TabItem[] = [
    {
      id: "profile",
      label: (
        <div className='flex items-center gap-2'>
          <User className='h-6 w-6' />
          <span>Profile</span>
        </div>
      ),
      content: (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Profile Settings</h3>
          <p className='text-muted-foreground'>
            Update your profile information here.
          </p>
        </div>
      ),
    },
    {
      id: "notifications",
      label: (
        <div className='flex items-center gap-2'>
          <Bell className='h-6 w-6' />
          <span>Notifications</span>
        </div>
      ),
      content: (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Notification Preferences</h3>
          <p className='text-muted-foreground'>
            Manage your notification settings.
          </p>
        </div>
      ),
    },
    {
      id: "settings",
      label: (
        <div className='flex items-center gap-2'>
          <Settings className='h-6 w-6' />
          <span>Settings</span>
        </div>
      ),
      content: (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>General Settings</h3>
          <p className='text-muted-foreground'>
            Configure your account settings.
          </p>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className='min-h-screen bg-background w-full'>
        <div className='container mx-auto p-6 space-y-8'>
          {/* --- Header --- */}
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
            <div>
              <div className='flex items-center gap-2 mb-2'>
                <Badge className='px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'>
                  Component Showcase
                </Badge>
              </div>
              <h1 className='text-3xl md:text-4xl font-bold tracking-tight text-foreground'>
                Enterprise UI System
              </h1>
              <p className='text-muted-foreground mt-2 max-w-2xl text-lg'>
                A demonstration of modular, data-driven component architecture.
              </p>
            </div>
            <div className='flex gap-3'>
              <Button variant='outline' size='sm'>
                Documentation
              </Button>
              <Button size='sm'>Download Source</Button>
            </div>
          </div>

          <Separator />

          {/* --- Grid Layout --- */}
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
            {/* 1. Alerts Section */}
            <Card className='xl:col-span-1 border-l-4 border-l-amber-500 shadow-sm'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-md font-semibold flex items-center gap-2'>
                  <AlertTriangle className='h-6 w-6 text-amber-500' />
                  Critical Confirmations
                </CardTitle>
                <CardDescription>
                  State-controlled alert dialogs for destructive actions.
                </CardDescription>
              </CardHeader>
              <CardContent className='grid gap-3'>
                <Button
                  variant='destructive'
                  className='w-full justify-start hover:bg-red-600'
                  onClick={() => setDeleteAlertOpen(true)}
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  Delete Confirmation
                </Button>
                <Button
                  variant='outline'
                  className='w-full justify-start'
                  onClick={() => setLogoutAlertOpen(true)}
                >
                  <User className='mr-2 h-4 w-4' />
                  Session Logout
                </Button>
              </CardContent>
            </Card>

            {/* 2. Dynamic Forms (Dialogs) */}
            <Card className='xl:col-span-1 border-l-4 border-l-blue-500 shadow-sm'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-md font-semibold flex items-center gap-2'>
                  <MousePointerClick className='h-6 w-6 text-blue-500' />
                  Dynamic Forms (Modal)
                </CardTitle>
                <CardDescription>
                  Configuration-driven forms rendered within Dialogs.
                </CardDescription>
              </CardHeader>
              <CardContent className='grid gap-3'>
                <Button
                  variant='outline'
                  className='w-full justify-between group'
                  onClick={() =>
                    launchForm(
                      "dialog",
                      authFormConfig,
                      "Authentication",
                      "Secure user login example."
                    )
                  }
                >
                  <span className='flex items-center'>
                    <Lock className='mr-2 h-4 w-4' /> Auth Form
                  </span>
                </Button>

                <Button
                  variant='outline'
                  className='w-full justify-between group'
                  onClick={() =>
                    launchForm(
                      "dialog",
                      feedbackFormConfig,
                      "User Feedback",
                      "Collect structured user input."
                    )
                  }
                >
                  <span className='flex items-center'>
                    <MessageSquare className='mr-2 h-4 w-4' /> Survey Form
                  </span>
                </Button>

                <Button
                  variant='outline'
                  className='w-full justify-between group'
                  onClick={() =>
                    launchForm(
                      "dialog",
                      caseEntryFormConfig,
                      "Case Management",
                      "Complex enterprise data entry."
                    )
                  }
                >
                  <span className='flex items-center'>
                    <FileText className='mr-2 h-4 w-4' /> Case Entry
                  </span>
                </Button>
              </CardContent>
            </Card>

            {/* 3. Dynamic Sheets */}
            <Card className='xl:col-span-1 border-l-4 border-l-purple-500 shadow-sm'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-md font-semibold flex items-center gap-2'>
                  <PanelRight className='h-6 w-6 text-purple-500' />
                  Contextual Sheets
                </CardTitle>
                <CardDescription>
                  Using the same configurations in side-panel views.
                </CardDescription>
              </CardHeader>
              <CardContent className='grid gap-3'>
                <Button
                  variant='ghost'
                  className='w-full justify-between border bg-background hover:bg-accent py-2'
                  onClick={() =>
                    launchForm(
                      "sheet",
                      caseEntryFormConfig,
                      "Create New Case",
                      "Full height side-panel for editing."
                    )
                  }
                >
                  <span className='flex items-center'>
                    <Briefcase className='mr-2 h-4 w-4' /> Case Form Sheet
                  </span>
                  <ArrowRight className='h-3 w-3 text-muted-foreground' />
                </Button>
                <Button
                  variant='ghost'
                  className='w-full justify-between border bg-background hover:bg-accent py-2'
                  onClick={() =>
                    launchForm(
                      "sheet",
                      feedbackFormConfig,
                      "Quick Feedback",
                      "Slide-over survey."
                    )
                  }
                >
                  <span className='flex items-center'>
                    <MessageSquare className='mr-2 h-4 w-4' /> Feedback Sheet
                  </span>
                  <ArrowRight className='h-3 w-3 text-muted-foreground' />
                </Button>
              </CardContent>
            </Card>

            {/* 4. Tabs & Content */}
            <Card className='md:col-span-2 xl:col-span-3 shadow-sm border-t-2 border-t-slate-200 dark:border-t-slate-800'>
              <CardHeader>
                <CardTitle className='text-md font-semibold flex items-center gap-2'>
                  <Layers className='h-6 w-6 text-slate-500' />
                  Tabulated Data Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DynamicTabs tabs={mainTabs} defaultTabId='Tasks' />
              </CardContent>
            </Card>
          </div>

          <Separator className='my-12' />

          {/* Additional Examples Section */}
          <div className='space-y-12'>
            <div className='space-y-2'>
              <h1 className='text-3xl font-bold tracking-tight'>
                Dynamic Components Showcase
              </h1>
              <p className='text-muted-foreground'>
                Examples and demonstrations of reusable dynamic components
              </p>
            </div>
            {/* Dialog Examples */}
            <section className='space-y-4'>
              <div className='space-y-2'>
                <h2 className='text-2xl font-semibold'>Dialog Examples</h2>
                <p className='text-sm text-muted-foreground'>
                  Modal dialogs for various use cases
                </p>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='p-6 border rounded-lg space-y-3'>
                  <h3 className='font-semibold'>Basic Dialog</h3>
                  <p className='text-sm text-muted-foreground'>
                    Simple dialog with content
                  </p>
                  <Button
                    variant='outline'
                    className='w-full'
                    onClick={() => setBasicDialogOpen(true)}
                  >
                    Open Basic Dialog
                  </Button>
                </div>

                <div className='p-6 border rounded-lg space-y-3'>
                  <h3 className='font-semibold'>Form Dialog</h3>
                  <p className='text-sm text-muted-foreground'>
                    Dialog with form inside
                  </p>
                  <Button
                    variant='outline'
                    className='w-full'
                    onClick={() => setFormDialogOpen(true)}
                  >
                    Open Form Dialog
                  </Button>
                </div>

                <div className='p-6 border rounded-lg space-y-3'>
                  <h3 className='font-semibold'>Confirmation Dialog</h3>
                  <p className='text-sm text-muted-foreground'>
                    Dialog with action buttons
                  </p>
                  <Button
                    variant='outline'
                    className='w-full'
                    onClick={() => setConfirmDialogOpen(true)}
                  >
                    Open Confirmation
                  </Button>
                </div>
              </div>
            </section>

            {/* Sheet Examples */}
            <section className='space-y-4'>
              <div className='space-y-2'>
                <h2 className='text-2xl font-semibold'>Sheet Examples</h2>
                <p className='text-sm text-muted-foreground'>
                  Side panels from different directions
                </p>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='p-6 border rounded-lg space-y-3'>
                  <h3 className='font-semibold'>Right Sheet</h3>
                  <p className='text-sm text-muted-foreground'>
                    Sheet sliding from right
                  </p>
                  <Button
                    variant='outline'
                    className='w-full'
                    onClick={() => setRightSheetOpen(true)}
                  >
                    Open Right Sheet
                  </Button>
                </div>

                <div className='p-6 border rounded-lg space-y-3'>
                  <h3 className='font-semibold'>Left Sheet</h3>
                  <p className='text-sm text-muted-foreground'>
                    Sheet sliding from left
                  </p>
                  <Button
                    variant='outline'
                    className='w-full'
                    onClick={() => setLeftSheetOpen(true)}
                  >
                    Open Left Sheet
                  </Button>
                </div>

                <div className='p-6 border rounded-lg space-y-3'>
                  <h3 className='font-semibold'>Form Sheet</h3>
                  <p className='text-sm text-muted-foreground'>
                    Sheet with form content
                  </p>
                  <Button
                    variant='outline'
                    className='w-full'
                    onClick={() => setFormSheetOpen(true)}
                  >
                    Open Form Sheet
                  </Button>
                </div>
              </div>
            </section>

            {/* Tabs Examples */}
            <section className='space-y-4'>
              <div className='space-y-2'>
                <h2 className='text-2xl font-semibold'>Tabs Examples</h2>
                <p className='text-sm text-muted-foreground'>
                  Tabbed navigation for organizing content
                </p>
              </div>

              <div className='space-y-6'>
                <div className='p-6 border rounded-lg space-y-4'>
                  <div>
                    <h3 className='font-semibold mb-1'>Basic Tabs</h3>
                    <p className='text-sm text-muted-foreground'>
                      Simple tabs with text labels
                    </p>
                  </div>
                  <DynamicTabs tabs={basicTabs} defaultTabId='overview' />
                </div>

                <div className='p-6 border rounded-lg space-y-4'>
                  <div>
                    <h3 className='font-semibold mb-1'>Tabs with Icons</h3>
                    <p className='text-sm text-muted-foreground'>
                      Tabs with icons and labels
                    </p>
                  </div>
                  <DynamicTabs
                    tabs={iconTabs}
                    defaultTabId='profile'
                    onTabChange={tabId => console.log("Tab changed to:", tabId)}
                  />
                </div>
              </div>
            </section>

            {/* Standalone Form */}
            <section className='space-y-4'>
              <div className='space-y-2'>
                <h2 className='text-2xl font-semibold'>
                  Standalone Form Example
                </h2>
                <p className='text-sm text-muted-foreground'>
                  Dynamic form with validation and card wrapper
                </p>
              </div>

              <DynamicForm
                fields={formConfig.fields}
                buttons={formConfig.buttons}
                onSubmit={handleFormSubmit}
                showCard={true}
                isSubmitting={isSubmitting}
                formClassName='w-full'
                formFieldsClassName='grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8'
                formButtonClassName='flex flex-wrap gap-2 justify-end'
              />
            </section>
          </div>
        </div>
      </div>

      {/* --- RENDER: Dynamic Components (Controlled by State) --- */}

      {/* Dynamic Form Dialog */}
      <DynamicDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={activeTitle}
        description={activeDesc}
        dialogClassName='sm:max-w-lg'
      >
        <DynamicForm
          fields={activeFormConfig.fields}
          buttons={activeFormConfig.buttons}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          showCard={false}
          formButtonClassName='flex flex-wrap gap-2 justify-end'
        />
      </DynamicDialog>

      {/* Dynamic Sheet */}
      <DynamicSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={activeTitle}
        description={activeDesc}
        sheetClassName='sm:max-w-md w-full'
      >
        <DynamicForm
          fields={activeFormConfig.fields}
          buttons={activeFormConfig.buttons}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          showCard={false}
          formButtonClassName='flex flex-wrap gap-2 justify-end'
        />
      </DynamicSheet>

      {/* Basic Dialog */}
      <DynamicDialog
        open={basicDialogOpen}
        onOpenChange={setBasicDialogOpen}
        title='Basic Dialog Example'
        description='This is a simple dialog with custom content'
      >
        <div className='space-y-4'>
          <p className='text-sm text-muted-foreground'>
            This dialog demonstrates basic usage with a title, description, and
            custom content. You can put any React component here.
          </p>
          <div className='p-4 bg-muted rounded-md'>
            <p className='text-sm'>
              This is some highlighted content inside the dialog.
            </p>
          </div>
        </div>
      </DynamicDialog>

      {/* Form Dialog */}
      <DynamicDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        title='Submit Your Information'
        description='Please fill out the form below'
        dialogClassName='sm:max-w-2xl'
      >
        <DynamicForm
          fields={formConfig.fields}
          buttons={formConfig.buttons}
          onSubmit={handleFormSubmit}
          showCard={false}
          isSubmitting={isSubmitting}
          formClassName='w-full'
          formFieldsClassName='grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6'
          formButtonClassName='flex gap-2 justify-end'
        />
      </DynamicDialog>

      {/* Confirmation Dialog */}
      <DynamicDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title='Confirm Action'
        description='Are you sure you want to proceed with this action?'
        footer={
          <div className='flex gap-2 w-full sm:w-auto'>
            <Button
              variant='outline'
              onClick={() => setConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmAction}>Confirm</Button>
          </div>
        }
      >
        <div className='space-y-3'>
          <p className='text-sm text-muted-foreground'>
            This action cannot be undone. This will permanently delete your data
            and remove it from our servers.
          </p>
          <div className='p-3 bg-destructive/10 border border-destructive/20 rounded-md'>
            <p className='text-sm text-destructive font-medium'>
              ⚠️ Warning: This is a destructive action
            </p>
          </div>
        </div>
      </DynamicDialog>

      {/* Right Sheet */}
      <DynamicSheet
        open={rightSheetOpen}
        onOpenChange={setRightSheetOpen}
        title='User Settings'
        description='Manage your account settings and preferences'
        side='right'
        footer={
          <Button onClick={() => setRightSheetOpen(false)} className='w-full'>
            Save Changes
          </Button>
        }
      >
        <div className='space-y-6'>
          <div className='space-y-2'>
            <h4 className='font-medium'>Account Information</h4>
            <p className='text-sm text-muted-foreground'>
              Update your account details here. This sheet slides from the right
              side.
            </p>
          </div>
          <div className='space-y-4'>
            {[1, 2, 3, 4, 5].map(item => (
              <div key={item} className='p-4 border rounded-md'>
                <p className='text-sm'>Setting option {item}</p>
              </div>
            ))}
          </div>
        </div>
      </DynamicSheet>

      {/* Left Sheet */}
      <DynamicSheet
        open={leftSheetOpen}
        onOpenChange={setLeftSheetOpen}
        title='Navigation Menu'
        description='Quick access to all sections'
        side='left'
      >
        <div className='space-y-2'>
          {[
            { icon: FileText, label: "Documents" },
            { icon: MessageSquare, label: "Messages" },
            { icon: User, label: "Profile" },
            { icon: Settings, label: "Settings" },
            { icon: Bell, label: "Notifications" },
          ].map((item, index) => (
            <Button
              key={index}
              variant='ghost'
              className='w-full justify-start'
              onClick={() => setLeftSheetOpen(false)}
            >
              <item.icon className='mr-2 h-4 w-4' />
              {item.label}
            </Button>
          ))}
        </div>
      </DynamicSheet>

      {/* Form Sheet */}
      <DynamicSheet
        open={formSheetOpen}
        onOpenChange={setFormSheetOpen}
        title='Add New Entry'
        description='Fill out the form to create a new entry'
        side='right'
      >
        <DynamicForm
          fields={formConfig.fields}
          buttons={formConfig.buttons}
          onSubmit={handleFormSubmit}
          showCard={false}
          isSubmitting={isSubmitting}
          formClassName='w-full'
          formFieldsClassName='space-y-4'
          formButtonClassName='flex gap-2 justify-end'
        />
      </DynamicSheet>

      {/* Alert Dialogs */}
      <DynamicAlertDialog
        open={deleteAlertOpen}
        onOpenChange={setDeleteAlertOpen}
        title='Are you absolutely sure?'
        description='This action cannot be undone. This will permanently delete your data from our servers.'
        actionText='Delete'
        cancelText='Cancel'
        actionVariant='destructive'
        onAction={handleDelete}
        onCancel={() => setDeleteAlertOpen(false)}
      >
        <div className='p-4 bg-destructive/10 border border-destructive/20 rounded-md'>
          <p className='text-sm text-destructive font-medium'>
            ⚠️ Warning: This is a destructive action
          </p>
        </div>
      </DynamicAlertDialog>

      <DynamicAlertDialog
        open={logoutAlertOpen}
        onOpenChange={setLogoutAlertOpen}
        title='Logout Confirmation'
        description='Are you sure you want to logout? Any unsaved changes will be lost.'
        actionText='Logout'
        cancelText='Stay Logged In'
        onAction={handleLogout}
        onCancel={() => setLogoutAlertOpen(false)}
      />

      <DynamicAlertDialog
        open={successAlertOpen}
        onOpenChange={setSuccessAlertOpen}
        title='Submission Received'
        description='The dynamic form successfully captured the following data structure:'
        actionText='Done'
        cancelText='Close'
        onAction={() => setSuccessAlertOpen(false)}
        onCancel={() => setSuccessAlertOpen(false)}
      >
        <div className='flex flex-col items-center py-4 space-y-4 w-full'>
          <CheckCircle className='h-12 w-12 text-green-500 animate-in zoom-in' />
          <div className='w-full bg-slate-950 text-slate-50 p-3 rounded-md text-xs font-mono overflow-auto max-h-[200px]'>
            <pre>{JSON.stringify(submittedData, null, 2)}</pre>
          </div>
        </div>
      </DynamicAlertDialog>
    </>
  );
}

export default Dashboard;
