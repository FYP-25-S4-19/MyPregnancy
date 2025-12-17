from argon2 import PasswordHasher


def get_password_hasher() -> PasswordHasher:
    return PasswordHasher(
        time_cost=3,  # 3 iterations
        memory_cost=65536,  # 64 MiB of memory
        parallelism=4,  # Use 4 lanes/threads
        hash_len=32,  # Output hash length in bytes
        salt_len=16,  # Output salt length in bytes
    )
