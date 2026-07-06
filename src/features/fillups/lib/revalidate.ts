import { revalidatePath } from "next/cache";

/**
 * A fill-up mutation can shift full-tank interval boundaries anywhere in that
 * vehicle's series and changes the vehicle card's fill-up count, so every
 * page that derives from fill-up data is revalidated rather than targeting
 * one path — cheap and safe at this dataset size.
 */
export function revalidateFillUpPaths() {
	revalidatePath("/dashboard");
	revalidatePath("/fillups");
	revalidatePath("/statistics");
	revalidatePath("/vehicles");
}
