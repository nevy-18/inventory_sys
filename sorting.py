def shell_sort(arr, key):
    n = len(arr)
    gap = n // 2
    while gap > 0:
        for i in range(gap, n):
            temp = arr[i]
            j = i
            while j >= gap and getattr(arr[j - gap], key) > getattr(temp, key):
                arr[j] = arr[j - gap]
                j -= gap
            arr[j] = temp
        gap //= 2
    return arr

def merge_sort(arr, key):
    if len(arr) > 1:
        mid = len(arr) // 2
        L = arr[:mid]
        R = arr[mid:]
        merge_sort(L, key)
        merge_sort(R, key)
        i = j = k = 0
        while i < len(L) and j < len(R):
            if getattr(L[i], key) <= getattr(R[j], key):
                arr[k] = L[i]
                i += 1
            else:
                arr[k] = R[j]
                j += 1
            k += 1
        while i < len(L):
            arr[k] = L[i]
            i += 1
            k += 1
        while j < len(R):
            arr[k] = R[j]
            j += 1
            k += 1
    return arr

def adrenaline_hybrid_sort(arr, primary_key, secondary_key):
    rough_sorted = shell_sort(arr, primary_key)
    return merge_sort(rough_sorted, secondary_key)