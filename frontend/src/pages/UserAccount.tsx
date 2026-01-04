import { useState, useMemo } from "react";
import { useAuthStore, useUser, useAuthLoading } from "@/stores/auth.store";
import { DynamicForm } from "@/components/dynamic-form/DynamicForm";
import { DynamicTabs } from "@/components/dynamic-tabs/DynamicTabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Globe,
  Settings,
  Bell,
  Eye,
  Camera,
  Clock,
  CheckCheck,
  Info,
  Trash2,
  Smartphone,
  Languages,
  MessageSquare,
  TrendingUp,
  Building2,
  Map,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { TabItem } from "@/interface/DynamicTabs";
import type { FieldConfig, ButtonConfig } from "@/interface/DynamicForm";
import { useToast } from "@/hooks/use-toast";
import BentoCard from "@/components/BentoCard";

const initialNotifications = [
  {
    id: 1,
    type: "success" as const,
    icon: CheckCheck,
    title: "Profile Synced",
    message: "Your profile data has been loaded from the server.",
    time: "Just now",
    read: false,
    category: "account",
  },
  {
    id: 2,
    type: "info" as const,
    icon: Info,
    title: "Security Update",
    message: "We have updated our privacy policy.",
    time: "2 days ago",
    read: true,
    category: "updates",
  },
];

const notificationCategories = [
  {
    id: "communication",
    title: "Communications",
    description: "Messages, comments, and mentions",
    icon: MessageSquare,
    settings: [{ id: "messages", label: "New direct messages", enabled: true }],
  },
  {
    id: "updates",
    title: "Product Updates",
    description: "New features and announcements",
    icon: TrendingUp,
    settings: [
      { id: "features", label: "New feature releases", enabled: true },
    ],
  },
];

function UserAccount() {
  const user = useUser();
  const { updateUser } = useAuthStore();
  const isLoading = useAuthLoading();

  const { successToast } = useToast();

  const [currentPage, setCurrentPage] = useState<"profile" | "notifications">(
    "profile"
  );
  const [notifications, setNotifications] = useState(initialNotifications);
  const [categorySettings, setCategorySettings] = useState(
    notificationCategories
  );
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const profileConfig = useMemo(() => {
    if (!user) return { fields: [], buttons: [] };

    return {
      fields: [
        {
          name: "name",
          label: "Full Name",
          type: "text",
          placeholder: "John Doe",
          icon: User,
          defaultValue: user.name || "",
          helperText: "Your legal name",
          validation: {
            required: { value: true, message: "Full name is required" },
            custom: (val: string) => (val.length < 2 ? "Name too short" : null),
          },
        },
        {
          name: "email",
          label: "Email Address",
          type: "email",
          icon: Mail,
          defaultValue: user.email || "",
          disabled: true,
          helperText: "Contact support to update email",
        },
        {
          name: "mobile_no",
          label: "Phone Number",
          type: "text",
          placeholder: "+1 (555) 000-0000",
          icon: Phone,
          defaultValue: user.mobile_no || "",
        },

        {
          name: "profession",
          label: "Job Title",
          type: "text",
          placeholder: "Senior Developer",
          icon: Briefcase,
          defaultValue: user.profession || "",
        },
        {
          name: "company",
          label: "Company",
          type: "text",
          placeholder: "Acme Corp",
          icon: Building2,
          defaultValue: user.company || "",
        },

        {
          name: "address",
          label: "Street Address",
          type: "text",
          placeholder: "123 Main St",
          icon: MapPin,
          defaultValue: user.address || "",
          className: "md:col-span-2",
        },
        {
          label: "City",
          type: "text",
          placeholder: "New York",
          icon: Map,
          defaultValue: user.city || "",
        },
        {
          name: "state",
          label: "State / Province",
          type: "text",
          placeholder: "NY",
          icon: Map,
          defaultValue: user.state || "",
        },
        {
          name: "country",
          label: "Country",
          type: "text",
          placeholder: "USA",
          icon: Globe,
          defaultValue: user.country || "",
        },
      ] as FieldConfig[],

      buttons: [
        {
          label: isLoading ? "Saving..." : "Save Changes",
          variant: "default",
          type: "submit",
          disabled: isLoading,
        },
        {
          label: "Discard",
          variant: "outline",
          type: "reset",
        },
      ] as ButtonConfig[],
    };
  }, [user, isLoading]);

  const preferencesConfig = useMemo(() => {
    if (!user) return { fields: [], buttons: [] };

    return {
      fields: [
        {
          name: "language",
          label: "Interface Language",
          type: "select",
          icon: Languages,
          defaultValue: user.language || "en",
          options: [
            { label: "English", value: "en" },
            { label: "Spanish", value: "es" },
            { label: "French", value: "fr" },
            { label: "German", value: "de" },
          ],
        },
      ] as FieldConfig[],
      buttons: [
        {
          label: isLoading ? "Saving..." : "Save Preferences",
          variant: "default",
          type: "submit",
          disabled: isLoading,
        },
      ] as ButtonConfig[],
    };
  }, [user, isLoading]);

  const handleProfileSubmit = async (data: any, isValid: boolean) => {
    if (!isValid) return;

    try {
      await updateUser({
        name: data.name,
        mobile_no: data.mobile_no,
        profession: data.profession,
        company: data.company,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
      });
      successToast("Profile updated successfully");
    } catch (error) {
      console.error(error);
    }
  };

  const handlePreferencesSubmit = async (data: any, isValid: boolean) => {
    if (!isValid) return;

    try {
      await updateUser({
        language: data.language,
        timezone: data.timezone,
      });
      successToast("Preferences updated");
    } catch (error) {
      console.error(error);
    }
  };

  const markAsRead = (id: number) =>
    setNotifications(p => p.map(n => (n.id === id ? { ...n, read: true } : n)));
  const markAllAsRead = () =>
    setNotifications(p => p.map(n => ({ ...n, read: true })));
  const deleteNotification = (id: number) =>
    setNotifications(p => p.filter(n => n.id !== id));
  const toggleNotificationSetting = (cId: string, sId: string) => {
    setCategorySettings(prev =>
      prev.map(c =>
        c.id === cId
          ? {
              ...c,
              settings: c.settings.map(s =>
                s.id === sId ? { ...s, enabled: !s.enabled } : s
              ),
            }
          : c
      )
    );
  };

  const getNotificationStyle = (type: string) => {
    const styles = {
      success: {
        bg: "bg-green-100 dark:bg-green-900",
        icon: "text-green-600 dark:text-green-300",
        border: "border-l-green-500",
      },
      warning: {
        bg: "bg-amber-100 dark:bg-amber-900",
        icon: "text-amber-600 dark:text-amber-300",
        border: "border-l-amber-500",
      },
      info: {
        bg: "bg-blue-100 dark:bg-blue-900",
        icon: "text-blue-600 dark:text-blue-300",
        border: "border-l-blue-500",
      },
    };
    return styles[type as keyof typeof styles] || styles.info;
  };

  if (!user) {
    return (
      <div className='flex min-h-screen w-full items-center justify-center'>
        <div className='flex flex-col items-center gap-2'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
          <p className='text-muted-foreground text-sm'>
            Loading user profile...
          </p>
        </div>
      </div>
    );
  }

  const profileInfoContent = (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your personal details and public profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DynamicForm
            fields={profileConfig.fields}
            buttons={profileConfig.buttons}
            onSubmit={handleProfileSubmit}
            isSubmitting={isLoading}
            showCard={false}
            formFieldsClassName='grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6'
            formButtonClassName='flex gap-2 justify-end md:col-span-2'
          />
        </CardContent>
      </Card>

      <div className='grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[160px] '>
        <BentoCard className='col-span-2 md:col-span-1 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-blue-100 dark:border-blue-900'>
          <div className='relative z-10 flex h-full flex-col justify-between'>
            <div className='flex items-center gap-2'>
              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'>
                <Briefcase className='h-4 w-4' />
              </div>
              <span className='text-sm font-medium text-blue-600 dark:text-blue-300'>
                Status
              </span>
            </div>
            <div>
              <h3 className='text-3xl font-bold tracking-tight text-blue-950 dark:text-blue-100'>
                Active
              </h3>
              <p className='text-sm text-blue-600/80 dark:text-blue-300/70 mt-1'>
                Full access granted
              </p>
            </div>
          </div>
          <ShieldCheck className='absolute -right-4 -bottom-4 h-24 w-24 text-blue-500/10 rotate-[-15deg]' />
        </BentoCard>

        <BentoCard className='col-span-1 bg-linear-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40 border-emerald-100 dark:border-emerald-900'>
          <div className='relative z-10 flex h-full flex-col justify-between'>
            <div className='flex items-center gap-2'>
              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'>
                <CheckCircle2 className='h-4 w-4' />
              </div>
              <span className='hidden sm:inline text-sm font-medium text-emerald-600 dark:text-emerald-300'>
                Onboarding
              </span>
            </div>
            <div>
              <h3 className='text-2xl sm:text-3xl font-bold tracking-tight text-emerald-950 dark:text-emerald-100'>
                {user.onboarding ? "Pending" : "100%"}
              </h3>
              <p className='text-xs sm:text-sm text-emerald-600/80 dark:text-emerald-300/70 mt-1'>
                {user.onboarding ? "Tasks remaining" : "Completed"}
              </p>
            </div>
          </div>
          <Sparkles className='absolute -right-2 -bottom-2 h-20 w-20 text-emerald-500/10' />
        </BentoCard>

        <BentoCard className='col-span-1 bg-linear-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40 border-violet-100 dark:border-violet-900'>
          <div className='relative z-10 flex h-full flex-col justify-between'>
            <div className='flex items-center gap-2'>
              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400'>
                <Clock className='h-4 w-4' />
              </div>
              <span className='hidden sm:inline text-sm font-medium text-violet-600 dark:text-violet-300'>
                Joined
              </span>
            </div>
            <div>
              <h3 className='text-2xl sm:text-3xl font-bold tracking-tight text-violet-950 dark:text-violet-100'>
                {new Date(user.created_at || Date.now()).getFullYear()}
              </h3>
              <p className='text-xs sm:text-sm text-violet-600/80 dark:text-violet-300/70 mt-1'>
                Member since
              </p>
            </div>
          </div>
          <Clock className='absolute -right-2 -bottom-2 h-20 w-20 text-violet-500/10' />
        </BentoCard>
      </div>
    </div>
  );

  const preferencesContent = (
    <Card>
      <CardHeader>
        <CardTitle>Application Preferences</CardTitle>
        <CardDescription>Regional settings and localization</CardDescription>
      </CardHeader>
      <CardContent>
        <DynamicForm
          fields={preferencesConfig.fields}
          buttons={preferencesConfig.buttons}
          onSubmit={handlePreferencesSubmit}
          isSubmitting={isLoading}
          showCard={false}
          formFieldsClassName='space-y-5 max-w-xl'
          formButtonClassName='flex gap-2 mt-6'
        />
      </CardContent>
    </Card>
  );

  const allNotificationsContent = (
    <div className='space-y-4'>
      <Card>
        <CardHeader className='pb-4'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest notifications</CardDescription>
            </div>
            <div className='flex gap-2'>
              {unreadCount > 0 && (
                <Button size='sm' variant='outline' onClick={markAllAsRead}>
                  <CheckCheck className='h-4 w-4 mr-2' />
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <ScrollArea className='h-[600px]'>
            <div className='divide-y'>
              {notifications.map(notif => {
                const IconComponent = notif.icon;
                const style = getNotificationStyle(notif.type);
                return (
                  <div
                    key={notif.id}
                    className={`p-4 hover:bg-muted/50 transition-colors border-l-4 ${style.border} ${!notif.read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}
                  >
                    <div className='flex gap-4'>
                      <div className={`p-2 rounded-lg ${style.bg} h-fit`}>
                        <IconComponent className={`h-5 w-5 ${style.icon}`} />
                      </div>
                      <div className='flex-1 space-y-1'>
                        <div className='flex items-start justify-between'>
                          <p className='font-semibold pr-4'>{notif.title}</p>
                          {!notif.read && (
                            <div className='h-2 w-2 rounded-full bg-blue-600 mt-1.5' />
                          )}
                        </div>
                        <p className='text-sm text-muted-foreground'>
                          {notif.message}
                        </p>
                        <div className='flex items-center gap-4 pt-2'>
                          <p className='text-xs text-muted-foreground flex items-center gap-1'>
                            <Clock className='h-3 w-3' />
                            {notif.time}
                          </p>
                          <div className='flex gap-2'>
                            {!notif.read && (
                              <Button
                                size='sm'
                                variant='ghost'
                                className='h-7 text-xs'
                                onClick={() => markAsRead(notif.id)}
                              >
                                Mark read
                              </Button>
                            )}
                            <Button
                              size='sm'
                              variant='ghost'
                              className='h-7 text-xs text-destructive'
                              onClick={() => deleteNotification(notif.id)}
                            >
                              <Trash2 className='h-3 w-3 mr-1' />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  const preferencesNotifContent = (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Delivery Methods</CardTitle>
          <CardDescription>
            Choose how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between p-4 border rounded-lg'>
            <div className='flex items-center gap-3'>
              <div className='p-2'>
                <Mail className='h-5 w-5 text-blue-600 dark:text-blue-300' />
              </div>
              <div>
                <p className='font-medium'>Email Notifications</p>
                <p className='text-sm text-muted-foreground'>
                  Receive via email
                </p>
              </div>
            </div>
            <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
          </div>
          <div className='flex items-center justify-between p-4 border rounded-lg'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-green-100 dark:bg-green-900 rounded-lg'>
                <Smartphone className='h-5 w-5 text-green-600 dark:text-green-300' />
              </div>
              <div>
                <p className='font-medium'>Push Notifications</p>
                <p className='text-sm text-muted-foreground'>
                  Mobile app notifications
                </p>
              </div>
            </div>
            <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Categories</CardTitle>
          <CardDescription>
            Fine-tune which notifications you receive
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {categorySettings.map(category => {
            const IconComponent = category.icon;
            return (
              <div key={category.id} className='space-y-4'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-primary/10 rounded-lg'>
                    <IconComponent className='h-5 w-5 text-primary' />
                  </div>
                  <div>
                    <h3 className='font-semibold'>{category.title}</h3>
                    <p className='text-sm text-muted-foreground'>
                      {category.description}
                    </p>
                  </div>
                </div>
                <div className='ml-11 space-y-3'>
                  {category.settings.map(setting => (
                    <div
                      key={setting.id}
                      className='flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors'
                    >
                      <span className='text-sm'>{setting.label}</span>
                      <Switch
                        checked={setting.enabled}
                        onCheckedChange={() =>
                          toggleNotificationSetting(category.id, setting.id)
                        }
                      />
                    </div>
                  ))}
                </div>
                {category.id !==
                  categorySettings[categorySettings.length - 1].id && (
                  <Separator className='mt-6' />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );

  const profileTabs: TabItem[] = [
    {
      id: "profile",
      label: (
        <div className='flex items-center gap-2'>
          <User className='h-4 w-4' />
          <span>Profile Info</span>
        </div>
      ),
      content: profileInfoContent,
    },
    {
      id: "preferences",
      label: (
        <div className='flex items-center gap-2'>
          <Settings className='h-4 w-4' />
          <span>Preferences</span>
        </div>
      ),
      content: preferencesContent,
    },
  ];

  const notificationTabs: TabItem[] = [
    {
      id: "all",
      label: (
        <div className='flex items-center gap-2'>
          <Bell className='h-4 w-4' />
          <span>All Notifications</span>
          {unreadCount > 0 && (
            <Badge variant='destructive' className='ml-1 h-5 px-1.5'>
              {unreadCount}
            </Badge>
          )}
        </div>
      ),
      content: allNotificationsContent,
    },
    {
      id: "preferences",
      label: (
        <div className='flex items-center gap-2'>
          <Settings className='h-4 w-4' />
          <span>Preferences</span>
        </div>
      ),
      content: preferencesNotifContent,
    },
  ];

  return (
    <div className='min-h-screen bg-transparent w-full'>
      <div className='mx-auto p-6'>
        {/* Page Navigation */}
        <div className='flex gap-4 mb-8'>
          <Button
            variant={currentPage === "profile" ? "default" : "outline"}
            onClick={() => setCurrentPage("profile")}
            className='gap-2'
          >
            <User className='h-4 w-4' /> Profile
          </Button>
          <Button
            variant={currentPage === "notifications" ? "default" : "outline"}
            onClick={() => setCurrentPage("notifications")}
            className='gap-2'
          >
            <Bell className='h-4 w-4' /> Notifications
            {unreadCount > 0 && (
              <Badge variant='destructive' className='ml-1 h-5 px-1.5'>
                {unreadCount}
              </Badge>
            )}
          </Button>
        </div>

        <div className='space-y-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-500'>
          {/* USER PROFILE PAGE */}
          {currentPage === "profile" && (
            <>
              {/* Header Card */}
              <Card className='border-t-4 border-t-blue-500 shadow-sm hidden lg:block'>
                <CardHeader>
                  <div className='flex items-start justify-between flex-col md:flex-row gap-4'>
                    <div className='flex gap-4'>
                      <div className='relative group'>
                        <Avatar className='h-24 w-24 border-4 border-background shadow-lg transition-transform group-hover:scale-105'>
                          <AvatarImage
                            src={
                              user.avatar_url ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`
                            }
                          />
                          <AvatarFallback className='text-2xl font-bold'>
                            {user.name?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <Button
                          size='icon'
                          variant='outline'
                          className='absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-md'
                        >
                          <Camera className='h-4 w-4' />
                        </Button>
                      </div>
                      <div className='space-y-1'>
                        <CardTitle className='text-3xl font-bold flex items-center gap-2'>
                          {user.name}
                          {user.role === "admin" && (
                            <Badge className='text-xs bg-primary'>Admin</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className='text-base'>
                          {user.profession || "No Job Title"}
                        </CardDescription>
                        <div className='flex flex-wrap gap-2 mt-3'>
                          <Badge
                            variant='outline'
                            className='gap-1 font-normal'
                          >
                            <Mail className='h-3 w-3' />
                            {user.email}
                          </Badge>
                          {user.city && (
                            <Badge
                              variant='outline'
                              className='gap-1 font-normal'
                            >
                              <MapPin className='h-3 w-3' />
                              {user.city}, {user.country}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant='outline'
                      className='gap-2'
                      onClick={() =>
                        window.open(`/public/${user.id}`, "_blank")
                      }
                    >
                      <Eye className='h-4 w-4' /> Public Profile
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              <DynamicTabs
                tabs={profileTabs}
                defaultTabId='profile'
                onTabChange={tabId => console.log("Profile tab:", tabId)}
              />
            </>
          )}

          {/* USER NOTIFICATIONS PAGE */}
          {currentPage === "notifications" && (
            <>
              <Card className='border-t-4 border-t-purple-500'>
                <CardHeader>
                  <div className='flex items-center justify-between flex-col md:flex-row gap-4'>
                    <div className='flex items-center gap-4'>
                      <div className='p-3 bg-purple-100 dark:bg-purple-900 rounded-lg'>
                        <Bell className='h-8 w-8 text-purple-600 dark:text-purple-300' />
                      </div>
                      <div>
                        <CardTitle className='text-3xl font-bold'>
                          Notifications
                        </CardTitle>
                        <CardDescription className='text-base mt-1'>
                          Stay updated with your activity
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant='default' className='text-sm px-3 py-1.5'>
                      {unreadCount} Unread
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              <DynamicTabs
                tabs={notificationTabs}
                defaultTabId='all'
                onTabChange={tabId => console.log("Notification tab:", tabId)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserAccount;
