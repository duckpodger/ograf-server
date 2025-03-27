import Router from "@koa/router"
import * as ServerAPI from "../types/serverAPI"
import { ParameterizedContext, DefaultState, DefaultContext } from "koa"

export function literal<T>(o: T): T {
	return o
}


export type CTX = ParameterizedContext<
	DefaultState,
	DefaultContext
		& Router.RouterParamContext<DefaultState, DefaultContext>
		& { request: { body: ServerAPI.AnyBody } },
	ServerAPI.AnyReturnValue
>


