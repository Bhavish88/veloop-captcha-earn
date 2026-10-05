import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from .managers import UserManager


class UserRole(models.TextChoices):
    USER = "USER", "User"
    ADMIN = "ADMIN", "Admin"


class AccountStatus(models.TextChoices):
    ACTIVE = "ACTIVE", "Active"
    SUSPENDED = "SUSPENDED", "Suspended"
    BLOCKED = "BLOCKED", "Blocked"
    CLOSED = "CLOSED", "Closed"


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model for VELoop, mirroring the original User collection semantics:
    - UUID primary key
    - Unique normalized email as the authentication field
    - Explicit role (USER, ADMIN)
    - Account status (ACTIVE, SUSPENDED, BLOCKED, CLOSED)
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True, max_length=255)
    name = models.CharField(max_length=100)
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.USER,
    )
    account_status = models.CharField(
        max_length=20,
        choices=AccountStatus.choices,
        default=AccountStatus.ACTIVE,
        db_index=True,
    )

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    class Meta:
        db_table = "core_users"
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.email} ({self.role})"

    @property
    def is_admin(self):
        return self.role == UserRole.ADMIN or self.is_superuser

    def save(self, *args, **kwargs):
        # Synchronize is_staff with admin role
        if self.role == UserRole.ADMIN:
            self.is_staff = True
        # Synchronize is_active with account status
        self.is_active = (self.account_status == AccountStatus.ACTIVE)
        super().save(*args, **kwargs)
